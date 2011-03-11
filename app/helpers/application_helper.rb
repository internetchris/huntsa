module ApplicationHelper
  
  def flash_messages
      %w(notice warning error).each do |msg|
        concat content_tag(:div, content_tag(:span, flash[msg.to_sym]),
          :class => "flash_#{msg}") unless flash[msg.to_sym].blank?
      end
    end
  
end
