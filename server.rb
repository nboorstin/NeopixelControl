#!/usr/bin/env ruby
require 'sinatra'
require 'sinatra-websocket'

set :bind, '0.0.0.0'
set :public_folder, __dir__ + '/static'
set :sockets, []

["/test"].each do |path|
  get path do
    instance = request.path_info[1..-1] + ".json"
    puts instance
    erb :tabs, :locals => {:instance => instance}
  end
end

get '/' do
  if !request.websocket?
    redirect to('/tabs.html')
  else
    request.websocket do |ws|
      ws.onopen do
        ws.send("Hello World!")
        settings.sockets << ws
      end
      ws.onmessage do |msg|
        puts msg
        EM.next_tick { settings.sockets.each{|s| s.send(msg) } }
      end
      ws.onclose do
        warn("websocket closed")
        settings.sockets.delete(ws)
      end
    end
  end
end
