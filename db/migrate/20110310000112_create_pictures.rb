class CreatePictures < ActiveRecord::Migration
  def self.up
    create_table :pictures do |t|
      
      t.string   :picture_file_name
      t.string   :picture_content_type
      t.integer  :picture_file_size
      t.datetime :picture_updated_at
      t.string   :story
      t.string   :caliber
      t.date     :date_shot
      t.boolean  :record_book
      t.string   :rank
      t.string   :signature
      t.integer  :user_id
      t.timestamps
    end
  end

  def self.down
    drop_table :pictures
  end
end
