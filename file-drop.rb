def upload_temp_file
    
    @foundFile = false
    @previewPath = "";
    if !is_empty(request.env['HTTP_X_FILENAME'])
        @foundFile = true
      
        #generate a random file ID and insert it into the file name
        @fileID = (1000 + rand(9000)).to_s()
        @dir = RAILS_ROOT + "/path/to/uploads/" + request.session_options[:id]
        @filePcs = request.env['HTTP_X_FILENAME'].split(".");
        @fileExt = @filePcs.pop();
        @fileName = @filePcs.join(".") + "-" + @fileID + "." + @fileExt;
        @path = @dir + "/" + @fileName;
        
        #make a directory for the session if one doesn't exist
        if !File.directory?(@dir)
            Dir.mkdir @dir 
        end
        #write the file
        #.read can only be performed once
        File.open(@path, "wb") { |f| f.write(request.env['rack.input'].read) }
        
        @previewPath = "../preview/dir/" + request.session_options[:id] + "/" + @fileName
    end
    
    #return the file id to the client
    respond_to do |format|
        format.json {render :json => {"fileID" =>@fileID, "path" => @previewPath} }
    end
end