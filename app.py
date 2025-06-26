from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
import smtplib
from itsdangerous import URLSafeTimedSerializer
from email.message import EmailMessage
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, template_folder='frontend', static_folder='static')
CORS(app)
app.secret_key = os.getenv("FLASK_SECRET_KEY") or 'fallback_secret'

# Serializer for token generation
serializer = URLSafeTimedSerializer(app.secret_key)

# Database configuration
DB_CONFIG = {
    'host': os.getenv("DB_HOST"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
    'database': os.getenv("DB_NAME")
}

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

# Home
@app.route('/')
def home():
    return render_template('index.html')

# Register
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = generate_password_hash(request.form['password'])

        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)", (name, email, password))
            conn.commit()
            flash('Registered successfully!', 'success')
        except mysql.connector.IntegrityError:
            flash('Email already exists.', 'danger')
        finally:
            cursor.close()
            conn.close()
        return redirect(url_for('login'))
    return render_template('register.html')

# Login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['email'] = user['email']
            return redirect(url_for('editor'))  # ✅ Redirect to editor
        else:
            flash("Invalid email or password", "danger")
            return redirect(url_for('login'))  # Redirect back on failure

    return render_template('login.html')

# editor route 
@app.route('/editor')
def editor():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('editor.html')

@app.route('/forgot-password')
def forgot_password():
    return render_template('forgot.html')

@app.route('/api/send-reset', methods=['POST'])
def send_reset():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        token = serializer.dumps(email, salt='password-reset-salt')
        reset_link = f"http://localhost:5000/reset-password/{token}"

        msg = EmailMessage()
        msg['Subject'] = 'CodeCanvas Password Reset Link'
        msg['From'] = os.getenv('MAIL_USER')
        msg['To'] = email
        msg.set_content(f"""
Hello,

We received a request to reset your password on CodeCanvas.

Click the link below to reset it:
{reset_link}

This link will expire in 30 minutes.

If you didn't request a reset, you can ignore this email.

- CodeCanvas Support Team
        """)

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(os.getenv('MAIL_USER'), os.getenv('MAIL_PASS'))
            smtp.send_message(msg)

        return jsonify({"message": "Reset link sent to your email!"}), 200

    except Exception as e:
        print("Email send error:", e)
        return jsonify({"error": "Failed to send email."}), 500

# Show Password Reset Form from Token
@app.route('/reset-password/<token>')
def reset_password_form(token):
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=1800)
        return redirect(url_for('reset_password_page', email=email))
    except Exception as e:
        print("Token error:", e)
        return "Invalid or expired link", 400

# Render HTML Reset Form Page
@app.route('/reset-password-page')
def reset_password_page():
    return render_template('reset_password_form.html')

# Handle Password Reset Submission
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('password')

    if not email or not new_password:
        return jsonify({"error": "Email and new password are required."}), 400

    try:
        hashed_password = generate_password_hash(new_password)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password = %s WHERE email = %s", (hashed_password, email))
        rows_updated = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()

        if rows_updated == 0:
            return jsonify({"error": "No user found with this email."}), 404

        return jsonify({"message": "Password has been reset successfully."}), 200

    except Exception as e:
        print("Reset password error:", e)
        return jsonify({"error": "Failed to reset password."}), 500

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
