class PicturesController < ApplicationController
  before_filter :require_user

  def new
    @picture = Picture.new
  end

  def create
    @picture = Picture.create( params[:picture] )
    redirect_to trophy_room_path
  end

end
