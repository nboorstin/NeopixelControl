#!/usr/bin/env ruby
require 'sinatra'
require 'sinatra-websocket'
require 'json'

set :bind, '0.0.0.0'
set :public_folder, __dir__ + '/static'
set :sockets, []

instances = ["test"]

get '/' do
  redirect to('/test')
end

$sites = []
$esps = []
$thread = nil
$data = {}
def get(path)
  if $data[path].nil?
    $data[path] = JSON.parse File.read "static/#{path}.json"
  end
end

def message(msg, ws, path)
  puts msg
  unless $thread.nil? || !$thread.status
    Thread.kill($thread)
  end
  $thread = Thread.new(msg) {|msg|
    sleep 5
    puts "thread done"
    get path
    $data[path].update JSON.parse msg
    File.open("static/#{path}.json","w") do |f|
      f.write $data[path].to_json
    end
  }
  puts settings.sockets
  EM.next_tick { $sites.select{|s| s != ws}.each{|s| s.send(msg) } }
  if (msg.include? '"solidColor"') 
    color = msg.split('"')[-2][1..-1]
    EM.next_tick { $esps.select{|s| s != ws}.each{|s| s.send("solidColor:#{color}") } }
  end
end

instances.each do |path|
  get "/#{path}" do
    instance = request.path_info[1..-1]
    puts instance
    erb :tabs, :locals => {:instance => instance}
  end
  get "/#{path}/site" do
    request.websocket do |ws|
      ws.onopen do
        #ws.send("Hello World!")
        $sites.append(ws)
      end
      ws.onmessage do |msg|
        message msg, ws, path
      end
      ws.onclose do
        warn("websocket closed")
        $sites.delete(ws)
      end
    end
  end
  get "/#{path}/esp" do
    request.websocket do |ws|
      ws.onopen do
        #ws.send("Hello World!")
        $esps.append(ws)
        get path
        puts $data[path]['solidColor'][1..-1]
        EM.next_tick { ws.send("solidColor:#{$data[path]['solidColor'][1..-1]}")}
      end
      ws.onmessage do |msg|
        message "{\"on\":#{msg == "on" ? "true" : "false"}}", ws, path
      end
      ws.onclose do
        warn("websocket closed")
        $esps.delete(ws)
      end
    end
  end
end
