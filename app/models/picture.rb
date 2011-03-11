class Picture < ActiveRecord::Base
   has_attached_file :picture, :styles => { :thumb => "250x250>", :large => "600x600" }
   belongs_to :user
   
   validates_presence_of :shooters_name
   validates_presence_of :shooters_place
end
