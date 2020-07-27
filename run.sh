echo -n "ip address: "
ifconfig | grep 'inet 192' | awk '{print $2}'
#echo -n "public ip address: "
#curl https://ipinfo.io/ip
python3 first.py
#env FLASK_APP=first.py flask run --host=0.0.0.0
