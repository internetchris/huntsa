class MainController < ApplicationController
  
  def index
    @pictures = Picture.find(:all, :conditions => {:front_page => true})
  end
  
  def trophy_room
    @pictures = Picture.find(:all, :order => "created_at DESC")
  end
  
  def ranch
  end
  
  def outreach
  end
  
  def story
    @picture = Picture.find(params[:id])
    render :layout => false
  end
  
  def hunting_picture
    @picture = Picture.find(params[:id])
    render :layout => false
  end
end
