import os
import json
import time
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
from openai import OpenAI
import base64
from pathlib import Path

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max
app.config['STATE_FILE'] = 'processing_state.json'

# Create necessary folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Initialize OpenAI client (l'utilisateur devra configurer sa clé API)
client = None

def init_openai_client():
    global client
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key:
        client = OpenAI(api_key=api_key)
    return client is not None

def load_state():
    """Charge l'état de traitement depuis le fichier JSON"""
    if os.path.exists(app.config['STATE_FILE']):
        with open(app.config['STATE_FILE'], 'r') as f:
            return json.load(f)
    return {
        'files': [],
        'current_index': 0,
        'processed': [],
        'failed': [],
        'status': 'idle'
    }

def save_state(state):
    """Sauvegarde l'état de traitement dans le fichier JSON"""
    with open(app.config['STATE_FILE'], 'w') as f:
        json.dump(state, f, indent=2)

def process_pdf_with_gpt(pdf_path, custom_gpt_id=None, max_retries=3):
    """
    Traite un PDF avec le custom GPT et retourne le contenu RTF
    Avec retry logic pour la résilience
    """
    if not client:
        raise Exception("OpenAI client non initialisé. Vérifiez votre OPENAI_API_KEY")

    # Lire le PDF en base64
    with open(pdf_path, 'rb') as f:
        pdf_content = base64.b64encode(f.read()).decode('utf-8')

    for attempt in range(max_retries):
        try:
            # Utiliser le custom GPT via l'API Assistants
            if custom_gpt_id:
                # Créer un thread
                thread = client.beta.threads.create()

                # Uploader le fichier
                file = client.files.create(
                    file=open(pdf_path, 'rb'),
                    purpose='assistants'
                )

                # Ajouter le message avec le fichier
                message = client.beta.threads.messages.create(
                    thread_id=thread.id,
                    role="user",
                    content="Convertis ce PDF en format RTF. Retourne uniquement le contenu RTF.",
                    attachments=[{
                        "file_id": file.id,
                        "tools": [{"type": "file_search"}]
                    }]
                )

                # Créer le run avec l'assistant custom
                run = client.beta.threads.runs.create(
                    thread_id=thread.id,
                    assistant_id=custom_gpt_id
                )

                # Attendre la complétion
                while run.status in ['queued', 'in_progress']:
                    time.sleep(1)
                    run = client.beta.threads.runs.retrieve(
                        thread_id=thread.id,
                        run_id=run.id
                    )

                if run.status == 'completed':
                    # Récupérer la réponse
                    messages = client.beta.threads.messages.list(thread_id=thread.id)
                    rtf_content = messages.data[0].content[0].text.value
                    return rtf_content
                else:
                    raise Exception(f"Run failed with status: {run.status}")
            else:
                # Fallback: utiliser le chat API standard
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {
                            "role": "system",
                            "content": "Tu es un expert en conversion de documents. Convertis les PDFs en format RTF en préservant la structure et le formatage."
                        },
                        {
                            "role": "user",
                            "content": f"Convertis ce document en format RTF. Retourne uniquement le contenu RTF formaté correctement."
                        }
                    ]
                )
                return response.choices[0].message.content

        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                time.sleep(wait_time)
                continue
            else:
                raise e

@app.route('/')
def index():
    """Page principale"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    """Upload multiple PDFs"""
    if 'files[]' not in request.files:
        return jsonify({'error': 'Aucun fichier fourni'}), 400

    files = request.files.getlist('files[]')
    uploaded_files = []

    for file in files:
        if file and file.filename.endswith('.pdf'):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            uploaded_files.append(filename)

    # Initialiser l'état
    state = load_state()
    state['files'] = uploaded_files
    state['current_index'] = 0
    state['processed'] = []
    state['failed'] = []
    state['status'] = 'ready'
    save_state(state)

    return jsonify({
        'message': f'{len(uploaded_files)} fichiers uploadés',
        'files': uploaded_files
    })

@app.route('/start-processing', methods=['POST'])
def start_processing():
    """Démarre le traitement des PDFs"""
    data = request.json
    custom_gpt_id = data.get('custom_gpt_id')

    if not init_openai_client():
        return jsonify({'error': 'OPENAI_API_KEY non configurée'}), 400

    state = load_state()
    if not state['files']:
        return jsonify({'error': 'Aucun fichier à traiter'}), 400

    state['status'] = 'processing'
    save_state(state)

    # Traiter les fichiers de manière synchrone (pour simplicité)
    # En production, utiliser Celery ou un worker asynchrone
    while state['current_index'] < len(state['files']):
        filename = state['files'][state['current_index']]
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        try:
            # Traiter le PDF
            rtf_content = process_pdf_with_gpt(pdf_path, custom_gpt_id)

            # Sauvegarder le RTF
            rtf_filename = filename.replace('.pdf', '.rtf')
            rtf_path = os.path.join(app.config['OUTPUT_FOLDER'], rtf_filename)
            with open(rtf_path, 'w', encoding='utf-8') as f:
                f.write(rtf_content)

            state['processed'].append(filename)

        except Exception as e:
            state['failed'].append({
                'file': filename,
                'error': str(e)
            })

        state['current_index'] += 1
        save_state(state)

    state['status'] = 'completed'
    save_state(state)

    return jsonify({
        'message': 'Traitement terminé',
        'processed': len(state['processed']),
        'failed': len(state['failed']),
        'details': state
    })

@app.route('/status', methods=['GET'])
def get_status():
    """Récupère l'état actuel du traitement"""
    state = load_state()
    total = len(state['files'])
    current = state['current_index']
    progress = (current / total * 100) if total > 0 else 0

    return jsonify({
        'status': state['status'],
        'total': total,
        'current': current,
        'progress': round(progress, 2),
        'processed': len(state['processed']),
        'failed': len(state['failed']),
        'failed_files': state['failed']
    })

@app.route('/download/<filename>')
def download_file(filename):
    """Télécharge un fichier RTF converti"""
    filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    return jsonify({'error': 'Fichier non trouvé'}), 404

@app.route('/reset', methods=['POST'])
def reset():
    """Réinitialise l'état et nettoie les fichiers"""
    state = {
        'files': [],
        'current_index': 0,
        'processed': [],
        'failed': [],
        'status': 'idle'
    }
    save_state(state)

    # Optionnel: nettoyer les dossiers
    # for folder in [app.config['UPLOAD_FOLDER'], app.config['OUTPUT_FOLDER']]:
    #     for file in os.listdir(folder):
    #         os.remove(os.path.join(folder, file))

    return jsonify({'message': 'État réinitialisé'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
