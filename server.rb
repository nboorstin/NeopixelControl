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
  return $data[path]
end

def message(msg, ws, path)
  puts msg
  unless $thread.nil? || !$thread.status
    Thread.kill($thread)
  end
  $thread = Thread.new(msg) {|msg|
    sleep 5
    puts "thread done"
    hash = get path
    hash = hash.merge JSON.parse msg
    File.open("static/#{path}.json","w") do |f|
      f.write hash.to_json
    end
  }
  puts settings.sockets
  EM.next_tick { $esps.select{|s| s != ws}.each{|s| s.send(msg) } }
  EM.next_tick { $sites.select{|s| s != ws}.each{|s| s.send(msg) } }
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
        puts (get path)['solidColor']
        EM.next_tick { ws.send("{\"solidColor\":\"#{(get path)['solidColor']}\"}")}
      end
      ws.onmessage do |msg|
        message msg, ws, path
      end
      ws.onclose do
        warn("websocket closed")
        $esps.delete(ws)
      end
    end
  end
end
