class Picture < ActiveRecord::Base
   has_attached_file :picture, :styles => { :thumb => "250x250>", :large => "600x600" }
   belongs_to :user
end
