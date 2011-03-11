module ActionView
  module Helpers  
    module PrototypeHelper  
      class JavaScriptGenerator  
        module GeneratorMethods  

          def show_flash(flash)
            flash.each_pair do |k,v|
              msg = @context.content_tag("div", v, :class => "flash_#{k}")
              page.replace_html("#flash_wrapper", msg)
            end
            unless flash.empty? 
              page.call("flash_show")
              page.call("flash_delayed_hide")
            end
          end

        end
      end
    end
  end
end
