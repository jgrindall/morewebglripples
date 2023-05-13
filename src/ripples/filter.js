/**
* @param data - input pixels data
* @param idx - the index of the central pixel
* @param w - image width (width*4 in case of RGBA)
* @param m - the gradient mask (for Sobel=[1, 2, 1])
*/
function conv3x(data, idx, w, m){
    return (m[0]*data[idx - w - 4] + m[1]*data[idx - 4] + m[2]*data[idx + w - 4]
        -m[0]*data[idx - w + 4] - m[1]*data[idx + 4] - m[2]*data[idx + 4 + 4]);
  }
  
  function conv3y(data, idx, w, m){
    return (m[0]*data[idx - w - 4] + m[1]*data[idx - w] + m[2]*data[idx - w + 4]
        -(m[0]*data[idx + w - 4] + m[1]*data[idx + w] + m[2]*data[idx + w + 4]));
  }
  

  function gradient_internal(pixels, mask)
  {
    var data = pixels.data;
    var w = pixels.width*4;
    var l = data.length - w - 4;
    var buff = new data.constructor(new ArrayBuffer(data.length));
    
    for (var i = w + 4; i < l; i+=4){
      var dx = conv3x(data, i, w, mask);
      var dy = conv3y(data, i, w, mask);
      const rgb = Math.sqrt(dx*dx + dy*dy);



   
      if(rgb > 10){
        buff[i] = 100
        buff[i + 1] =100
        buff[i + 2] = 0
        buff[i + 3] = 255;

      }
      else{
        buff[i] =0
        buff[i + 1] =0
        buff[i + 2] = 0
        buff[i + 3] = 0;

      }

      
     
    }
    return buff;

    //pixels.data.set(buff);


  }
  

  function gradient(canvas, dest){
    var context = canvas.getContext('2d');
    var pixels = context.getImageData(0, 0, canvas.width,canvas.height);
    var destPixels = dest.getImageData(0, 0, canvas.width,canvas.height)
    const buffer = gradient_internal(pixels, [1, 2, 1]);
  
    destPixels.data.set(buffer)
    dest.putImageData(destPixels, 0, 0);
  }

  export default gradient