#############################################################
#       Application
#############################################################

set :application, "viewdev.net"
set :user, "internetchris"
set :port, 31979
set :use_sudo, true
set :deploy_to, "/home/internetchris/public_html/#{application}"
set :keep_releases, 3

#############################################################
#       Git
#############################################################

default_run_options[:pty] = true
set :repository, "git@github.com:internetchris/huntsa.git"
set :scm, "git"

#############################################################
#       Servers
#############################################################

role :app, "174.143.148.37"
role :web, "174.143.148.37"
role :db,  "174.143.148.37", :primary => true

#############################################################
#       Passenger
#############################################################

namespace :deploy do
  desc "Restart Application"
  task :restart, :roles => :app do
    run "ln -s /home/internetchris/public_html/viewdev.net/shared/fulfillment #{current_path}/fulfillment"
    run "ln -nfs #{shared_path}/config/database.yml #{latest_release}/config/database.yml"
    run "touch #{current_path}/tmp/restart.txt"
  end
 
end


