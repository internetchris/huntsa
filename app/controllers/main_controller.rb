class MainController < ApplicationController
  
  def index
    @pictures = Picture.find(:all, :conditions => {:front_page => true})
  end
  
  def trophy_room
    @pictures = Picture.find(:all, :order => "created_at DESC", :conditions => {:front_page => false})
  end
  
  def ranch
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
