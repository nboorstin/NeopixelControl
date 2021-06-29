#!/usr/bin/env ruby
require 'sinatra'
require 'sinatra-websocket'
require 'json'

set :logging, false
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
$keys = ["solidColor", "on", "brightness", "mode", "multiColor"]
def get(path)
  if $data[path].nil?
    $data[path] = JSON.parse File.read "static/#{path}.json"
  end
end

def message(msg, ws, path)
  puts msg
  get path
  $data[path].update JSON.parse msg
  unless $thread.nil? || !$thread.status
    Thread.kill($thread)
  end
  $thread = Thread.new(msg) {|msg|
    sleep 5
    puts "thread done"
    File.open("static/#{path}.json","w") do |f|
      f.write $data[path].to_json
    end
  }
  puts "..."
  #puts settings.sockets
  EM.next_tick { $sites.select{|s| s != ws}.each{|s| s.send(msg) } }
  to_esp = JSON.parse(msg).slice(*$keys)
  if to_esp.key?("multiColor")
    to_esp['multiColor'] = to_esp['multiColor']['colors'].join(';')
  end
  #if $data[path].key?("brightness") and $data[path].key?("solidColor") and (to_esp.key?("brightness") or to_esp.key?("solidColor"))
  #  to_esp['solidColor'] = '#'+(1..5).step(2).map{|i| (($data[path]["solidColor"][i..i+1]).to_i(16)*($data[path]["brightness"].to_i/100.0)).round.to_s.rjust(2,"0")}.join("")
  #end
  #to_esp.delete("brightness")
  unless to_esp.empty?
    puts to_esp
    EM.next_tick { $esps.select{|s| s != ws}.each{|s| s.send(to_esp.to_json[1..-2]) } }
  end
end

instances.each do |path|
  get "/#{path}" do
    #puts instance
    unless $thread.nil? || !$thread.status
      Thread.kill($thread)
      get path
      puts "thread done"
      File.open("static/#{path}.json","w") do |f|
        f.write $data[path].to_json
      end
    end
    instance = request.path_info[1..-1]
    erb :tabs, :locals => {:instance => instance}
  end
  get "/#{path}/site" do
    pp request
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
        to_esp = $data[path].slice(*$keys)
        if to_esp.key?("multiColor")
          to_esp['multiColor'] = to_esp['multiColor']['colors'].join(';')
        end
        #if $data[path].key?("brightness") and to_esp.key?("solidColor")
        #  to_esp['solidColor'] = '#'+(1..5).step(2).map{|i| ((to_esp["solidColor"][i..i+1]).to_i(16)*($data[path]["brightness"].to_i/100.0)).round.to_s.rjust(2,"0")}.join("")
        #end
        unless to_esp.empty?
          puts to_esp
          EM.next_tick { ws.send(to_esp.to_json[1..-2])}
        end
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
