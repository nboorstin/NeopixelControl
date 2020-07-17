echo -n "ip address: "
ifconfig | grep 'inet 192' | awk '{print $2}'
env FLASK_APP=first.py flask run --host=0.0.0.0
