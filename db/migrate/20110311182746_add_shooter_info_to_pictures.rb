class AddShooterInfoToPictures < ActiveRecord::Migration
  def self.up
     add_column :pictures, :shooter_name, :string
     add_column :pictures, :shooter_place, :string
  end

  def self.down
  end
end
