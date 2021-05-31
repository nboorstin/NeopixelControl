#!/usr/bin/env ruby
require 'sinatra'
require 'sinatra-websocket'
require 'json'

set :bind, '0.0.0.0'
set :public_folder, __dir__ + '/static'
set :sockets, []

get '/' do
  redirect to('/test')
end

thread = nil
instances = ["test"]
instances.each do |path|
  get "/#{path}" do
    instance = request.path_info[1..-1]
    puts instance
    erb :tabs, :locals => {:instance => instance}
  end
  get "/#{path}/site" do
    request.websocket do |ws|
      ws.onopen do
        ws.send("Hello World!")
        settings.sockets << ws
      end
      ws.onmessage do |msg|
        puts msg
        unless thread.nil? || !thread.status
          Thread.kill(thread)
        end
        thread = Thread.new(msg) {|msg|
          sleep 5
          #puts "thread done"
          hash = JSON.parse File.read "static/#{path}.json"
          hash = hash.merge JSON.parse msg
          #puts hash
          File.open("static/#{path}.json","w") do |f|
            f.write hash.to_json
          end
          #puts msg
        }
        #EM.next_tick { settings.sockets.each{|s| s.send(msg) } }
      end
      ws.onclose do
        warn("websocket closed")
        settings.sockets.delete(ws)
      end
    end
  end
end
