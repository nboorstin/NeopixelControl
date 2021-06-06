#\ --quiet

require './server'
log = File.new("sinatra.log", "w")
$stdout.reopen(log)
$stdout.sync = true
run Sinatra::Application
