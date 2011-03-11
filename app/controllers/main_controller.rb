class MainController < ApplicationController
  
  def index
  end
  
  def trophy_room
    @pictures = Picture.find(:all, :order => "created_at DESC")
  end
  
  def ranch
  end
  
  def story
    @picture = Picture.find(params[:id])
    render :layout => false
  end
  
  def picture
    @picture = Picture.find(params[:id])
    render :layout => false
  end
end
