Adresă repository git:

https://github.com/MarioCioara/licenta

https://gitlab.upt.ro/mario.cioara/licenta/-/tree/main?ref_type=heads

Aplicația rulează la adresa https://rift-pulse.com


Instrucțiuni pentru instalarea și utilizarea aplicație Rift Pulse


Sunt necesare următoarele programe:
Python 3.10+    https://www.python.org/downloads/
Node.js 18+     https://nodejs.org/
PostgreSQL 14+  https://www.postgresql.org/download/

După ce se instalează PostgresSQL,se deschide un terminal și se rulează comanda psql apoi CREATE DATABASE esportsdb;

Utilizatorul apoi deschide un nou terminal și se mută în folderul backend și rulează:

pip install -r requirements.txt

python manage.py migrate

python manage.py createsuperuser

python manage.py runserver

Acum backend-ul este pregătit și poate fi accesat la adresa:

API-ul backend-ului se află la adresa http://localhost:8000

Panoul de administrare Django se găsește la adresa http://localhost:8000/admin

Utilizatorul deschide un al doilea terminal,se mută în folderul frontend și rulează comenzile:

npm install

npm start

Frontend-ul se găsește la adresa http://localhost:3000

Utilizatorul deschide un al treilea terminal și se mută în folderul backend și rulează comenzile:

python manage.py setup_scheduled_tasks   -- comanda care pregătește cele trei task-uri care rulează în background(task pentru tras meciuri din API-ul LolEsports,task pentru tras rezultatele meciurilor din API-ul LolEsports,task care trimite email către utilizator)

python manage.py qcluster                -- comanda care pornește task-urile în background

Comenzi opționale:

Aceste comenzi trag din API-ul LolEsports meciurile dacă utilizatorul vrea o actualizare instantă

python manage.py fetch_matches_now

python manage.py fetch_matches_now --schedules-only

python manage.py fetch_matches_now --results-only

python manage.py fix_match_regions

python manage.py fix_missing_vods
