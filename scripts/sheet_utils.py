"""
    Adapted mostly from Google developer documentation
"""
# Had a problem where `from googleapiclient import discovery` barfed and
# the advice [here](https://stackoverflow.com/a/58549686/2683) didn't work.
# So I resorted to copying the "googleapiclient" folder from
# `../chamber_music_played`, but I can't remember how/why/when I got it . . .
from fastcache import lru_cache

@lru_cache()
def get_credentials():
    """Gets valid user credentials from storage.
        BUT FIRST: Follow the steps on this page
            https://developers.google.com/sheets/api/quickstart/python
        to create a client_secrets.json file.
        AND THEN
            run quickstart.py
    """
    import os
    from oauth2client.file import Storage

    def _get_credentials(credential_path):
        credentials = None
        try:
            credentials = Storage(credential_path).get()
            if not credentials or credentials.invalid:
                raise Exception("run `python quickstart.py` to get some credentials!")
        except Exception as e:
            print("Credential Exception: %s" % e)
        return credentials

    cred_file = 'sheets.googleapis.com-python-quickstart.json'
    # system_path = os.path.expanduser('~/.credentials/')  # fails for crontab
    system_path = '/Users/jsundram/.credentials'
    local_path = os.getcwd()

    for path in [system_path, local_path]:
        print("looking for credentials in path: %s" % path)
        credentials = _get_credentials(os.path.join(path, cred_file))
        if credentials:
            return credentials


def get_service(credentials=None):
    import httplib2
    from googleapiclient import discovery

    credentials = credentials or get_credentials()
    return discovery.build(
        'sheets',
        'v4',
        http=credentials.authorize(httplib2.Http()),
        discoveryServiceUrl='https://sheets.googleapis.com/$discovery/rest?version=v4'
    )


def get_values(sheet_id, range_desc, service=None):
    service = service or get_service()
    return service.spreadsheets().values().get(
        spreadsheetId=sheet_id,
        range=range_desc
    ).execute().get('values', [])


def set_values(sheet_id, range_desc, data, service=None):
    # Data should be a list of lists (each list corresponds to a row)
    # If this fails with "Request had insufficient authentication scopes"
    # then you need to make sure your credentials (see above) were generated with read/write
    # and not readonly scope: https://developers.google.com/sheets/api/guides/authorizing
    service = service or get_service()
    return service.spreadsheets().values().update(
        spreadsheetId=sheet_id,
        range=range_desc,
        valueInputOption='RAW', # could do 'USER_ENTERED'
        body=dict(values=data)
    ).execute()


