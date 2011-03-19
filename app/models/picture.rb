class Picture < ActiveRecord::Base
   has_attached_file :picture, :styles => { :thumb => "250x250>", :medium => "350x350", :large => "600x600" }
   belongs_to :user
   
   validates_presence_of :shooter_name
   validates_presence_of :shooter_place
   
   def self.load_species
     return @@species if defined?(@@species)

     filename = Rails.root + "config/species.yml"
     if File.exist?(filename)
       @@species = yaml = YAML::load(File.open(filename))
     else
       @@species = ["Miscellaneous",]
     end
   end

   SPECIES = load_species
end
