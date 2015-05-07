def upload_temp_file
    
    @foundFile = false
    @previewPath = "";
    
    @uploadsDir = "/path/to/uploads/";
    @previewDir = "../relative/path/to/uploads/";
    if !is_empty(request.env['HTTP_X_FILENAME'])
        @foundFile = true
      
        #generate a random file ID and insert it into the file name
        @fileID = (1000 + rand(9000)).to_s()
        @dir = RAILS_ROOT + @uploadsDir + request.session_options[:id]
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
        
        @previewPath = @previewDir + request.session_options[:id] + "/" + @fileName
    end
    
    #clean up orphan files -- not fully tested
    Dir.foreach(@uploadsDir) do |f|
        next if f == "." or f == ".."
        
        #deletes files more than 24 hours old
        @createTime = Date.new(File.ctime(f)).to_time.to_i
        if Time.now.to_i - @create >  3600 * 24
            File.delete(f)
        end
    end
    
    
    #return the file id to the client
    respond_to do |format|
        format.json {render :json => {"fileID" =>@fileID, "path" => @previewPath} }
    end
end