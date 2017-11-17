//loads image to encrypt into, or makes email if there is something already encrypted
function imageOrEmail(){	
	if(getType(mainBox.innerHTML.trim())[0]){
		var hashTag = encodeURIComponent(mainBox.textContent.trim()).replace(/%0A/g,'%0D%0A');		//item ready for link
		var linkText = "Click the link below if you wish to process this automatically using the web app (the app will open in a new tab), or simply copy it and paste it into URSA:%0D%0A%0D%0Ahttps://passlok.com/ursa#" + hashTag;

		var link = "mailto:"+ "?subject= " + "&body=Message encrypted with URSA v.4.2 %0D%0A%0D%0ADecrypt with shared Key.%0D%0A%0D%0A" + linkText;

		if(isMobile){ 	 											//new window for PC, same window for mobile
			window.open(link,"_parent")
		}else{
			window.open(link,"_blank")
		}
	}else{
		if(!pwd.textContent.trim()){
			setTimeout(function(){mainMsg.textContent = 'You must enter a Key first, plus a message if you want to encrypt. To decrypt, leave the main box empty.'},0);
			throw('password box empty')
		}
	}
}

// load image for hiding text
var importImage = function(e){
    var reader = new FileReader();
    reader.onload = function(event) {
        // set the preview
        previewImg.style.display = 'block';
        document.getElementById('previewImg').src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
	previewImg.onload = function(){
		var contents = mainBox.innerHTML.trim();
		if(contents){								//encrypt if there is something there
			fileMode.checked = false;
			Encrypt(contents);						//encrypt first
		
			mainBox.textContent = mainBox.textContent.split('==')[1];		//take tags out
			imageScr.style.display = 'block';
			shadow.style.display = 'block';
			updateCapacity()

		}else{										//otherwise decrypt
			decode()
		}
	}
}

//show how much text can be hidden in the image
function updateCapacity(){
	var	textSize = mainBox.textContent.length * 6;							//text size in bits

	imageMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																				//give it 2 seconds to complete
		if(imageMsg.textContent == 'PROCESSING') imageMsg.textContent = 'There was an error calculating the capacity, but the image is still usable'
	},2000)	

setTimeout(function(){
	//start measuring png capacity. Subtract 4 bits used to encode k, 48 for the end marker
	var shadowCanvas = document.createElement('canvas'),
		shadowCtx = shadowCanvas.getContext('2d');
	shadowCanvas.style.display = 'none';

	shadowCanvas.width = previewImg.naturalWidth;
	shadowCanvas.height = previewImg.naturalHeight;
	shadowCtx.drawImage(previewImg, 0, 0, shadowCanvas.width, shadowCanvas.height);
	
	var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
		opaquePixels = 0;
	for(var i = 3; i < imageData.data.length; i += 4){				//look at alpha channel values
		if(imageData.data[i] == 255) opaquePixels++					//use pixels with full opacity only
	}
	var pngBits = opaquePixels * 3 - 270;
		
	//now measure jpeg capacity
	if(previewImg.src.slice(11,15) == 'jpeg'){					//true jpeg capacity calculation
		var lumaCoefficients = [],
			count = 0;
		jsSteg.getCoefficients(previewImg.src, function(coefficients){
			var subSampling = 1;
			for(var index = 1; index <= 3; index++){						//first luma, then chroma channels, index 0 is always empty
				lumaCoefficients = coefficients[index];
				if(lumaCoefficients){
					if(index != 1) subSampling = Math.floor(coefficients[1].length / lumaCoefficients.length);
	 	 			for (var i = 0; i < lumaCoefficients.length; i++) {
						for (var j = 0; j < 64; j++) {
							if(lumaCoefficients[i][j] != 0) count += subSampling		//if subsampled, multiply the count since it won't be upon re-encoding
   	 					}
					}
					if(index == 1) var firstCount = count
				}else{
					count += firstCount													//repeat count if the channel appears not to exist (bug in js-steg)
				}
			}
			var jpgBits = Math.floor(count - 270);					//4 bits used to encode k, 48 for the end marker, 218 buffer for second message

			imageMsg.textContent = 'This image can hide ' + pngBits + ' bits as PNG, ' + jpgBits + ' as JPG. The box contains ' + textSize + ' bits'
		})
	}else{															//no jpeg, so estimate capacity for a normal image
		var jpgBits = Math.floor(pngBits / 20);

		imageMsg.textContent = 'This image can hide ' + pngBits + ' bits as PNG, at least ' + jpgBits + ' as JPG. The box contains ' + textSize + ' bits'
	}
},30)					//end of timeout
}

//function to encode mainBox into the image
function encode(){
	var text = mainBox.textContent.trim();

	if(!text){
		imageMsg.textContent = 'There is nothing to hide';
		throw("box empty of content")
	}
	if(previewImg.src.length < 100){																			//no image loaded
		imageMsg.textContent = 'Please load an image before clicking this button';
		throw("no image loaded")
	}
	imageMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started

	var array2embed = toBin(text),
		pwdArray = pwd.textContent.trim().replace(/\n/g,' ').split('|'),
		password = pwdArray[0].trim();
	if(pwdArray.length == 3){
		var array2embed2 = toBin(LZString.compressToBase64(pwdArray[2].trim())),
			password2 = pwdArray[1].trim()
	}else{
		var array2embed2 = '',
			password2 = ''
	}
	
	if(this.id == 'encodePNGBtn'){
		setTimeout(function(){
			encodePNG(previewImg,array2embed,password.trim(),function(msg){		//text is made base64 first, then a binary array
				imagePwd.value = '';
				if(msg) imageMsg.textContent = msg
			},
			true,0,
			array2embed2,password2,0)																							//true: don't add extra noise
		},10)
	}else{
		setTimeout(function(){
			encodeJPG(previewImg,array2embed,password,function(msg){
				imagePwd.value = '';
				if(msg) imageMsg.textContent = msg
			},
			true,0,
			array2embed2,password2,0)
		},10)
	}
	
	previewImg.onload = function(){
			imageMsg.textContent = 'Text hidden in the image. Right-click to save it.'
	}
}

//extract text from the image
function decode(){	
	imageMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started

	var pwdArray = pwd.textContent.trim().replace(/\n/g,' ').split('|'),
		password = pwdArray[0].trim();
	if(pwdArray.length == 2){
		var	password2 = pwdArray[1].trim()
	}else{
		var	password2 = ''
	}

	setTimeout(function(){
		decodeImage(previewImg,password,function(textBin,msg){
			mainMsg.textContent = msg;
			if(textBin.length == 300 || textBin.length == 256){
				mainBox.textContent = fromBin(textBin) 									//don't try to decrypt PassLok Locks
			}else{
				Decrypt(fromBin(textBin))
			}
			image2main()
			},
			true,0,
			password2,function(textBin,msg){
				setTimeout(function(){mainMsg.textContent = LZString.decompressFromBase64(fromBin(textBin))},0)
			},0)
	},10)
}