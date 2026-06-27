"""
    Adapted mostly from Google developer documentation
"""
# googleapiclient/ is a local copy kept in this directory (the pip package
# has historically had import issues; see the original comment in git history).
from functools import lru_cache
import json
import os

# update.py only reads; set_values() callers need to re-auth with write scope:
#   https://www.googleapis.com/auth/spreadsheets
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

_CREDENTIALS_DIR = os.path.expanduser('~/.credentials')
# New-format token saved after first successful auth with google-auth.
_NEW_TOKEN_FILE = os.path.join(_CREDENTIALS_DIR, 'sheets_token_v2.json')
# Legacy oauth2client token — mined for client_id/client_secret if present.
_LEGACY_TOKEN_FILE = os.path.join(_CREDENTIALS_DIR,
                                  'sheets.googleapis.com-python-quickstart.json')
# Standard client secrets file downloaded from Google Cloud Console.
_CLIENT_SECRETS_FILE = os.path.join(_CREDENTIALS_DIR, 'client_secrets.json')


def _client_config():
    """Return an InstalledAppFlow client_config, trying legacy token then client_secrets.json."""
    # Prefer the legacy token file (has client_id/secret embedded).
    if os.path.exists(_LEGACY_TOKEN_FILE):
        with open(_LEGACY_TOKEN_FILE) as f:
            d = json.load(f)
        if d.get('client_id') and d.get('client_secret'):
            return {
                "installed": {
                    "client_id": d['client_id'],
                    "client_secret": d['client_secret'],
                    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            }
    # Fall back to a standard client_secrets.json from Google Cloud Console.
    if os.path.exists(_CLIENT_SECRETS_FILE):
        with open(_CLIENT_SECRETS_FILE) as f:
            return json.load(f)
    return None


def _save_token(creds):
    os.makedirs(_CREDENTIALS_DIR, exist_ok=True)
    with open(_NEW_TOKEN_FILE, 'w') as f:
        f.write(creds.to_json())


@lru_cache()
def get_credentials():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    creds = None

    if os.path.exists(_NEW_TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(_NEW_TOKEN_FILE, SCOPES)
        except Exception as e:
            print(f"Could not load token file ({e}); will re-authenticate.")

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            _save_token(creds)
            return creds
        except Exception as e:
            print(f"Token refresh failed ({e}); re-authenticating...")

    config = _client_config()
    if not config:
        raise RuntimeError(
            f"No client credentials found. Download client_secrets.json from "
            f"the Google Cloud Console and place it at {_CLIENT_SECRETS_FILE}"
        )
    flow = InstalledAppFlow.from_client_config(config, SCOPES)
    creds = flow.run_local_server(port=0)
    _save_token(creds)
    return creds


@lru_cache()
def get_service():
    from googleapiclient import discovery

    credentials = get_credentials()
    return discovery.build(
        'sheets',
        'v4',
        credentials=credentials,
        discoveryServiceUrl='https://sheets.googleapis.com/$discovery/rest?version=v4'
    )


def get_values(sheet_id, range_desc, service=None):
    service = service or get_service()
    return service.spreadsheets().values().get(
        spreadsheetId=sheet_id,
        range=range_desc
    ).execute().get('values', [])


def set_values(sheet_id, range_desc, data, service=None):
    service = service or get_service()
    return service.spreadsheets().values().update(
        spreadsheetId=sheet_id,
        range=range_desc,
        valueInputOption='RAW',
        body=dict(values=data)
    ).execute()
