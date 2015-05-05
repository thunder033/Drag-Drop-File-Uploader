/**
 * FileDrop
 * Modular HTML 5 Drag & Drop File Uploader
 * Rocheseter Institute of Technology
 * 
 * Self-contained drag & drop file upload widget, which gracefully degrades to a styled
 * file input in browsers that don't support the necessary file upload APIs. Loads in
 * all assets/resources automatically (requires jQuery), only need to include the 
 * Javascript and create an instance.
 * 
 * Derived from the file uploader originally developed for ISNet Technology Request form.
 * 
 * NOTE: File uploading and server-side upload handling not fully implemented because
 * WIAN had its own file upload requirements. (11/19/14)
 * 
 * Authored By: 
 * Greg Rozmarynowycz
 * 9.23.2014
 */

/**
 * container: element to place the uploader in
 * widgetDir: directory where the other components of the widget are contained
 */
function FileDrop(container, widgetDir) {
    //parameters
    this.widgetDir = widgetDir;
    this.container = container;
    this.dropContainer = container;
    this.fileLimit = 1;
    this.dropCaption = "Drag & Drop files here";
    this.allowedTypes = ["png","jpeg","jpg"];
    this.fileUploadURL = "file-drop-handler.php";
    this.templateLocation = "file-drop.php";
    this.autoUpload =  true;
    this.fileParseCallback = null;
    this.cssURL = "file-drop.css?v="+parseInt(Math.random() * 100000); //dev salt to force css reload
    
    //If necessary, you can call jQuery.noConflict() here
    $j = jQuery;
    
    //--------------------------DON'T EDIT BELOW THIS LINE-------------------------------//
}
FileDrop.prototype.Init = function() {
	//check for the required HTML 5 file APIs
    this.HTML5Uploads = false;
    
	var xhr = new XMLHttpRequest();
	if(window.File && window.FileList && window.FileReader && xhr.upload)
	{
        this.HTML5Uploads = true;
		this.files = [];
        this.suspendedFile = null;
	}
    else {
        console.error("Browser doesn't support HTML 5 file uploads!");   
    }
    
    //Load the styles for the file drop
    if($j("link[href='"+this.widgetDir+this.cssURL+"']").length == 0)
    {
        $j("head").append($j("<link>").attr("rel","stylesheet").attr("type","text/css").attr("href",this.widgetDir+this.cssURL));
    }
    
     //Load the file drop template and initiate behaviors
    $j.get(this.widgetDir+this.templateLocation, {}, (function(fileDrop){
        return function(data)
        {
            fileDrop.dropContainer = $j(data);
            $j(fileDrop.dropContainer).appendTo(fileDrop.container);
            
            if(fileDrop.HTML5Uploads)
            {
                //activate drag and drop
                $j(fileDrop.dropContainer).addClass("active");

                //Set instruction text for the file drop area
                $j(".drop-area h6", fileDrop.dropContainer).html(this.dropCaption);

                //Assign events associated with the file drop
                $j(".drop-area", fileDrop.dropContainer).on("dragover",(function(fileDrop){
                    return function(e){
                        fileDrop.FileDragHover.call(fileDrop, e)    
                    }
                })(fileDrop));
                $j(".drop-area", fileDrop.dropContainer).on("dragleave",(function(fileDrop){
                    return function(e)
                    {
                        fileDrop.FileDragHover.call(fileDrop, e)    
                    }
                })(fileDrop));
                $j(".drop-area", fileDrop.dropContainer).on("drop",(function(fileDrop){
                    return function(e){
                        fileDrop.FileSelectHandler.call(fileDrop, e.originalEvent);
                        }
                })(fileDrop));

                //route files from the browse dialog into the drag & drop handler
                $j(".file-select", this.dropContainer).on("change",(function(fileDrop){
                    return function(e){
                        console.log("capturing input file...");
                        fileDrop.FileSelectHandler.call(fileDrop, e.originalEvent);
                        }
                })(fileDrop), "html");
            }
        }
    })(this));
}
FileDrop.prototype.FileSelectHandler = function(e){
	
	e.stopPropagation();
	e.preventDefault();
	
	//cancel drag event
	this.FileDragHover(e);
	
	//get file list
	var files = e.target.files || e.dataTransfer.files;
	
	for(var i = 0, f; f = files[i]; i++)
	{
		this.ParseFile(f);
	}
}

FileDrop.prototype.FlashError = function(err)
{
    $j(this.dropContainer).addClass("error");
    $j("h6",this.dropContainer).html(err);

    //Return to the default state after a few seconds
    setTimeout((function(fileDrop){
        return function()
        {
            $j(fileDrop.dropContainer).removeClass("error");
            $j("h6",fileDrop.dropContainer).html(fileDrop.dropCaption);
        }
    })(this), 2000);
}

FileDrop.prototype.ParseFile = function(f) {
    var ext = f.name.split(".").pop();
    $j(this.dropContainer).removeClass("hover");
	if($j(".file-list li", this.dropContainer).length < this.fileLimit)
	{
        console.log("parsing file...["+ext+"]");
        if($j.inArray(ext,this.allowedTypes) > -1)
        {
                
            var fileTypes = [ //these are mapped to the file icon sheet
                    "dmg","rar","zip","tgz","iso","java","rb","py","c","php","cpp","ics","exe",
                    "dat","xml","yml","sql","asp","h","css","html","js","less","scss","sass","",
                    ["ppt","pptx"],"pps","key","opd","otp","","","","","","","","",
                    "txt","rtf","doc","dot","docx","odt","ott","ods","ots","xls","dotx","xlsx","",
                    "gif","tga","eps","bmp","png","jpg","tiff","ai","psd","dwg","dxf","pdf","",
                    "mp4","avi","mov","mpg","qt","flv","m4v","","","","","","",
                    "mp3","wav","aiff","aac","mid","","","","","","","file",""],
                
                //properties of the icon positioning on the sheet
                rowWidth = 13,
                offsetX = 45,
                offsetY = 51,
                
                //Variables to store the position of the icon when we find it
                x = 0, y = 0, foundIcon = false;
            
            //Search for the icon in the sheet based on file extension
            if(ext != ""){
                for(i = 0; i < fileTypes.length; i++)
                {	
                    //check if the icon type matches
                    if(!(foundIcon = (ext == fileTypes[i])) && typeof fileTypes[i] == "object"){
                        //if multiple extension could give the same icon
                        foundIcon = ($j.inArray(ext, fileTypes[i]) > -1);
                    }

                    //if there was an icon
                    if(foundIcon)
                    {
                        //get its position on the icon sheet
                        x = i % rowWidth;
                        y = (i - x)/rowWidth;
                        break;
                    }
                }
            }

            //The default file icon
            if(!foundIcon){
                x = 11;
                y = 6;
            }
            
            //Basic elements that compose the file block
            var fileBlock = $j("<li>")[0],
                icon = $j("<div>").addClass("icon")[0];
            
            //retrieve the icon from the sheet
            icon.style.backgroundPosition = (-x * offsetX)+"px "+(-y * offsetY)+"px";

            //create the "file block"
            fileBlock.file = f;
            fileBlock.appendChild(icon);
            fileBlock.innerHTML += "<span>"+(f.name || f.fileName)+"</span><br>";
            fileBlock.innerHTML += "<span class='progress'></span>";
            fileBlock.className += "cf";
            fileBlock.title = f.name || f.fileName;
            
            //create button to allow file to be removed
            var removeBtn = $j("<div>").addClass("remove")[0];
            $j(removeBtn).click((function(fileDrop){
                return function()
                {
                    $j(this.parentNode).remove();
                    fileDrop.UpdateState();
                }
            })(this));
            fileBlock.appendChild(removeBtn);
            
            /**
             * External File Valiadtion
             * 
             * This code allows for external validation beyond basic type checking, in both
             * a synchronous and asynchronous manner.
             */
                
            var valid = true, //Whether or not the file is valid
                //The error message indicating why the file is invalid
                //Its an object so it can be passed "by reference" (the validation function can modify it without returning it)
                error = {message : null}; 
            
            // First we determine if a validation callback was provided
            if(this.fileParseCallback != null)
            {
                /**
                 * Execute the validation callback passing:
                 *  -> The file to validate
                 *  -> The error object to indicate an error message
                 *  -> The optional asynchrounous callback (if the validation function takes this argument, it is assumed to be
                 *     asynchronous, and we will wait for the callback to be executed to continue)
                 */
                valid = this.fileParseCallback(f, error, (function(fileDrop){
                    return function(error){
                        //Take th error is they validation function gave one
                        if(typeof error != "undefined")
                        {
                            fileDrop.suspendedFile.error = error;
                        }
                        /**
                         * To simplify the excution of the callback to a simple invocation, we call it here with the context of 
                         * the fileDrop
                         */
                        fileDrop.HandleExtFileValidation.call(fileDrop);
                    };
                })(this));
            }
            
            /**
             * If the validation callback returns undefined or if it took the async callback argument (it will have 3 arguments
             * if it did), we store the file and wait for the async callback to be executed
             */
            if(typeof valid == "undefined" || this.fileParseCallback && this.fileParseCallback.length == 3)
            {
                console.log("suspending file");
                this.suspendedFile = {file: f, fileBlock: fileBlock, error: error};
            }
            else if(valid === true)
            {
                //Add the file block to the drop area
                $j(".file-list", this.dropContainer).append(fileBlock);
                
                //perform file upload
                this.UploadFile(f, fileBlock);
            }
            else 
            {
                this.FlashError(error.message);
            }

            this.UpdateState();
        }
        else
        {
            //Display an the error to the user
            this.FlashError("Invalid file type!");
        }
    }
}
FileDrop.prototype.Clear = function() {
    $j(".file-list").html("");
    
}
FileDrop.prototype.HandleExtFileValidation = function()
{
    if(this.suspendedFile.error.message == null)
    {
        if(this.suspendedFile != null)
        {
            $j(".file-list", this.dropContainer).append(this.suspendedFile.fileBlock);
            this.UploadFile(this.suspendedFile.file, this.suspendedFile.fileBlock);
            this.suspendedFile = null;
            this.UpdateState();
        }
        else
        {
            this.FlashError("File upload error!");
            console.error("No suspended file present to upload!");
        }
    }
    else 
    {
        this.FlashError(this.suspendedFile.error.message);
    }
}
FileDrop.prototype.UploadFile = function(file, fileBlock) {
	var xhr = new XMLHttpRequest();
	
	//if upload API is present, setup and send request
	if(xhr.upload && this.autoUpload)
	{
		console.log("uploading file...");
	
		//file upload call back
		xhr.onreadystatechange = (function(fileDrop){
            return function()
            {
                //request completed
                if(xhr.readyState ==  4)
                {
                    var data = null,
                        error = true;

                    //attempt to get JSON out of the response
                    try {
                        data = JSON.parse(xhr.responseText);
                    }
                    catch(e) {
                        console.error(e);
                    }

                    if(data != null)
                    {
                        fileID = parseInt(data["fileID"]);

                        //valid file IDs will be a number between 1000 and 9999
                        if(fileID >= 1000 && fileID <= 9999)
                        {
                            error = false;

                            //process returned file data
                            xhr.upload.fileBlock.fileID = fileID;
                            var origFileName = xhr.upload.fileBlock.title;
                            var filePcs = origFileName.split(".");
                            var fileExt = filePcs.pop();
                            var fileName = filePcs.join(".") + "-" + fileID + "." + fileExt;

                            //update the file block and final file list
                            $j(xhr.upload.fileBlock).append("<input type='hidden' name='technology_request[support_files][]' value='"+fileName+"' />");
                            $j(".progress", xhr.upload.fileBlock).html("Uploaded");

                            //if its an image, give a preview of it
                            if(["png","jpg","gif","jpeg"].indexOf(fileExt.toLowerCase()) > -1)
                            {
                                
                                
                                var image = new Image();
                                //center the image vertically
                                image.onload = function()
                                {					
                                    if(this.parentNode.offsetHeight > this.offsetHeight && this.offsetHeight > 0)
                                    {
                                        this.style.marginTop = (this.parentNode.offsetHeight - this.offsetHeight)/2 + "px";
                                    }
                                }
                                image.src = data["path"];
                                image.alt = "uploaded file";

                                $j("div.icon", xhr.upload.fileBlock).append(image);
                                $j("div.icon", xhr.upload.fileBlock).css("background","#fff");
                            }
                        }
                    }

                    if(error){
                        $j(".progress", xhr.upload.fileBlock).html("Error");
                        $(xhr.upload.fileBlock).addClass("error");

                        setTimeout((function(fileBlock, fileDrop){
                            return function()
                            {
                                $(fileBlock).remove();
                                fileDrop.UpdateState();
                            }
                        })(xhr.upload.fileBlock, fileDrop), 3000);

                        console.log(xhr.responseText);
                    }
                }
            }
		})(this);
		//associates the request with a file block in the upload feedback area
		xhr.upload.fileBlock = fileBlock;
		//tracks & displays upload progress percentage
		xhr.upload.addEventListener("progress", (function(fileDrop,fileBlock){
			return function(e){
				fileDrop.UploadProgress(e,fileBlock);
			}
		})(this,fileBlock), false);
		
		xhr.open("POST", this.fileUploadURL, true);
		
		//set request headers
		xhr.setRequestHeader("X_FILENAME", file.name || file.fileName);
		xhr.setRequestHeader("Content-Type", "application/octet-stream");
		xhr.setRequestHeader("Accept","*/*");
		
		//send request in proper format
		if('getAsBinary' in file)
		{
			xhr.sendAsBinary(file.getAsBinary());
		}
		else {
			xhr.send(file);
		}
	}
}
FileDrop.prototype.UploadProgress = function(e,fileBlock) {
	//displays upload progress
	if(e.lengthComputable)
	{
		progress = parseInt((e.loaded/e.total) * 100);
		$j(".progress",fileBlock).html(progress + "%");
	}
}
FileDrop.prototype.UpdateState = function()
{
    var curFileCount = $j(".file-list li", this.dropContainer).length;
    
    //Re-activate the file drop if more files are allowed
    if(curFileCount < this.fileLimit) {
        $j(this.dropContainer).removeClass("full");
        $j(this.dropContainer).addClass("active");
    } 
    //Don't let the user upload any more files if they reach the limit
    else if(curFileCount >= this.fileLimit)
    {
        $j(this.dropContainer).removeClass("active");
        $j(this.dropContainer).addClass("full");
    }
}
FileDrop.prototype.FileDragHover = function(e) {
	
    //intercept the event
	e.stopPropagation();
	e.preventDefault();
	
	//gives visual feedback for dragging files into browser
	if(e.type == "dragover"){
		$j(this.dropContainer).addClass("hover");
	}
	else {
		$j(this.dropContainer).removeClass("hover");
	}
}