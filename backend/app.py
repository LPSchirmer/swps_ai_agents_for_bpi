
import os
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime
# ETL-Import
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../etl')))
from pipeline import run_etl_event_log, run_etl_textual_process_data

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'bpmn', 'xes', 'xml', 'csv', 'txt'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- ETL-Filter und API-Route ---
from pathlib import Path
RELEVANT_ETL_EXTENSIONS = {'.xes', '.csv', '.bpmn', '.txt'}

def get_etl_ready_files():
    """Gibt alle Uploads mit relevanten Endungen für den ETL-Prozess zurück"""
    files = []
    for filename in os.listdir(app.config['UPLOAD_FOLDER']):
        ext = Path(filename).suffix.lower()
        if ext in RELEVANT_ETL_EXTENSIONS:
            files.append(filename)
    return files

@app.route('/api/etl-ready-uploads', methods=['GET'])
def list_etl_ready_uploads():
    """Listet alle für den ETL-Prozess geeigneten Dateien auf"""
    try:
        files = get_etl_ready_files()
        return jsonify({
            'success': True,
            'etl_ready_files': files,
            'count': len(files)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Flask backend is running'
    }), 200


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file uploads"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Secure the filename and add timestamp
        original_filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{original_filename}"
        
        # Save the file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Nach dem Upload: ETL-Prozess starten
        ext = Path(filename).suffix.lower()
        etl_result = None
        try:
            if ext in {'.xes', '.csv', '.bpmn'}:
                run_etl_event_log(filepath)
                etl_result = 'event_log_etl_done'
            elif ext == '.txt':
                run_etl_textual_process_data(filepath)
                etl_result = 'textual_etl_done'
            else:
                etl_result = 'no_etl_run'
        except Exception as etl_error:
            etl_result = f'ETL-Error: {etl_error}'

        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'filename': original_filename,
            'stored_filename': filename,
            'file_size': os.path.getsize(filepath),
            'upload_time': timestamp,
            'etl_result': etl_result
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/text-input', methods=['POST'])
def text_input():
    """Handle text input and save as .txt file"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'No text provided'
            }), 400
        
        text_content = data['text']
        
        if not text_content.strip():
            return jsonify({
                'success': False,
                'error': 'Text content is empty'
            }), 400
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_user_input.txt"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save text to file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text_content)
        
        return jsonify({
            'success': True,
            'message': 'Text saved successfully',
            'filename': filename,
            'file_size': os.path.getsize(filepath),
            'upload_time': timestamp
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/uploads', methods=['GET'])
def list_uploads():
    """List all uploaded files"""
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.isfile(filepath):
                files.append({
                    'filename': filename,
                    'size': os.path.getsize(filepath),
                    'modified': datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
                })
        
        return jsonify({
            'success': True,
            'files': files,
            'count': len(files)
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print(f"🚀 Flask Backend starting...")
    print(f"📁 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"✅ Allowed file types: {', '.join(ALLOWED_EXTENSIONS)}")
    app.run(debug=True, host='0.0.0.0', port=5001)
