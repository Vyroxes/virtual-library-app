import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_talisman import Talisman
from flask_discord import DiscordOAuth2Session
from authlib.integrations.flask_client import OAuth

origins = [
    "http://localhost",
    "http://localhost:5173",
    "https://github.com",
    "https://discord.com"
]

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["10 per second"],
    storage_uri="memory://"
)
bcrypt = Bcrypt()
jwt = JWTManager()
cors = CORS(resources={r"/api/*": {"origins": origins}}, supports_credentials=True)
talisman = Talisman(
    force_https=True,
    content_security_policy={
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
        'connect-src': "'self' https://api.github.com",
        'font-src': "'self'",
        'object-src': "'none'",
        'base-uri': "'self'",
        'form-action': "'self'",
    },
    referrer_policy='strict-origin-when-cross-origin',
    feature_policy={
        'geolocation': "'none'",
        'microphone': "'none'",
        'camera': "'none'",
        'payment': "'none'",
        'autoplay': "'none'"
    },
    x_xss_protection=True,
    x_content_type_options=True,
    strict_transport_security=True,
    strict_transport_security_preload=True,
    strict_transport_security_max_age=31536000,
    strict_transport_security_include_subdomains=True,
    session_cookie_secure=True,
    session_cookie_http_only=True
)
discord = DiscordOAuth2Session()
oauth = OAuth()
oauth.register(
    name='github',
    client_id=os.getenv('GITHUB_CLIENT_ID'),
    client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)