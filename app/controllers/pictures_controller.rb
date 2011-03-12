class PicturesController < ApplicationController
  before_filter :require_user

  def new
    @picture = Picture.new
  end

  def create
    @picture = Picture.create( params[:picture] )
    redirect_to trophy_room_path
  end
  
  def edit
    @picture = Picture.find(params[:id])
  end
  
  def update
    @picture = Picture.find(params[:id])
    if @picture.update_attributes(params[:picture])
      flash[:notice] = 'Your picture was updated successfully'
    else
      flash[:error] = 'There was a problem updating your photo.'
    end
    redirect_to trophy_room_path
  end
    
  def show
    @picture = Picture.find(params[:id])
  end
  
  def destroy
    @picture = Picture.find(params[:id])
    if @picture.destroy
    flash[:notice] = "This picture has been removed"
    end
    redirect_to trophy_room_path
  end

end
