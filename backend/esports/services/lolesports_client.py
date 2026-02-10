import logging
import time
import requests
from django.conf import settings

logger = logging.getLogger('esports')

BASE_URL = 'https://esports-api.lolesports.com/persisted/gw/'
DEFAULT_API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'

LEAGUE_IDS = {
    'LCK': '98767991310872058',
    'LEC': '98767991302996019',
    'LPL': '98767991299243165',
    'LCS': '98767991314006698',
}


class LolesportsClient:

    def __init__(self):
        api_conf = getattr(settings, 'LOLESPORTS_API', {})
        self.base_url = api_conf.get('BASE_URL', BASE_URL)
        self.api_key = api_conf.get('API_KEY', DEFAULT_API_KEY)
        self.max_retries = api_conf.get('MAX_RETRIES', 3)
        self.session = requests.Session()
        self.session.headers.update({
            'x-api-key': self.api_key,
            'Accept': 'application/json',
        })

    def _get(self, endpoint, params=None):
        url = f'{self.base_url}{endpoint}'
        if params is None:
            params = {}
        params.setdefault('hl', 'en-US')

        for attempt in range(self.max_retries):
            try:
                resp = self.session.get(url, params=params, timeout=15)

                if resp.status_code == 200:
                    return resp.json()

                if resp.status_code == 429 or resp.status_code >= 500:
                    wait = 2 ** attempt
                    logger.warning(
                        'lolesports API %s returned %s, retrying in %ss (attempt %d/%d)',
                        endpoint, resp.status_code, wait, attempt + 1, self.max_retries
                    )
                    time.sleep(wait)
                    continue

                logger.error('lolesports API %s returned %s: %s', endpoint, resp.status_code, resp.text[:300])
                return None

            except requests.RequestException as exc:
                wait = 2 ** attempt
                logger.warning(
                    'lolesports API %s request error: %s, retrying in %ss (attempt %d/%d)',
                    endpoint, exc, wait, attempt + 1, self.max_retries
                )
                time.sleep(wait)

        logger.error('lolesports API %s: all %d retries exhausted', endpoint, self.max_retries)
        return None


    def get_leagues(self):
        data = self._get('getLeagues')
        if data and 'data' in data:
            return data['data'].get('leagues', [])
        return None

    def get_schedule(self, league_id, page_token=None):
        params = {'leagueId': league_id}
        if page_token:
            params['pageToken'] = page_token
        data = self._get('getSchedule', params)
        if data and 'data' in data:
            return data['data'].get('schedule', {})
        return None

    def get_tournaments_for_league(self, league_id):
        data = self._get('getTournamentsForLeague', params={'leagueId': league_id})
        if data and 'data' in data:
            return data['data'].get('leagues', [])
        return None

    def get_completed_events(self, tournament_id):
        data = self._get('getCompletedEvents', params={'tournamentId': tournament_id})
        if data and 'data' in data:
            return data['data'].get('schedule', {})
        return None

    def get_event_details(self, match_id):
        data = self._get('getEventDetails', params={'id': match_id})
        if data and 'data' in data:
            return data['data'].get('event', {})
        return None
