class AddSpecieAttributesToPictures < ActiveRecord::Migration
  def self.up
    add_column :pictures, :species, :string
    add_column :pictures, :front_page, :boolean
    change_column :pictures, :story, :text
  end

  def self.down
    remove_column :pictures, :species
    remove_column :pictures, :front_page
    change_column :pictures, :story, :string
  end
end
