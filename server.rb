#!/usr/bin/env ruby
require 'sinatra'

set :bind, '0.0.0.0'
set :public_folder, __dir__ + '/static'

get '/' do
  redirect to('/tabs.html')
end


