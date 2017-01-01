
var canvas;
var gl;

var program;

var numTimesToSubdivide = 5;

var index = 0;

var mvStack = [];

var pointsArray = [];
var colorArray = [];
var texCoordsArray = [];

var vTexCoord;


//类别
var wingColor = 1;
var bodyColor = 2;

//扇翅膀的幅度
var flap = 0;
var flap2 = 0;
var turn = false;
var startFlap = false;

var near = -10;
var far = 10;
var radius = 6.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

//  正方形纹理坐标
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var numVertices = 18;

var vertices = [
    vec4(-2, -2, 2, 1.0),
    vec4(-2, 2, 2, 1.0),
    vec4(2, 2, 2, 1.0),
    vec4(2, -2, 2, 1.0),
    vec4(-2, -2, -2, 1.0),
    vec4(-2, 2, -2, 1.0),
    vec4(2, 2, -2, 1.0),
    vec4(2, -2, -2, 1.0)
];

function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    // colorArray.push(vertices[a]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    // colorArray.push(vertices[b]);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    // colorArray.push(vertices[c]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);
    // colorArray.push(vertices[a]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[c]);
    // colorArray.push(vertices[c]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[d]);
    // colorArray.push(vertices[d]);
    texCoordsArray.push(texCoord[3]);
}

function texCube() {
   // quad(1, 0, 3, 2);
   // quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    // quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);

}

function configureTexture0( image ) {
    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);

    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    //  先进行绑定
    gl.uniform1i(gl.getUniformLocation(program, "texture0"), 0);
}
function configureTexture1(image) {
    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //  先进行绑定
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 1);
}
function triangle(a, b, c,type) {
    if(type == wingColor){
     pointsArray.push(a);
     colorArray.push(a);
     pointsArray.push(b);
     colorArray.push(b);
     pointsArray.push(c);
     colorArray.push(c);
     }else if(type == bodyColor){
        var bodyC = vec4(1,197/255,83/255,1);

        pointsArray.push(a);
        colorArray.push(bodyC);
        pointsArray.push(b);
        colorArray.push(bodyC);
        pointsArray.push(c);
        colorArray.push(bodyC);
     }
     index += 3;
}


function divideTriangle(a, b, c, count,type) {
    if ( count > 0 ) {

        var ab = normalize(mix( a, b, 0.5), true);
        var ac = normalize(mix( a, c, 0.5), true);
        var bc = normalize(mix( b, c, 0.5), true);

        divideTriangle( a, ab, ac, count - 1, type);
        divideTriangle( ab, b, bc, count - 1, type);
        divideTriangle( bc, c, ac, count - 1, type);
        divideTriangle( ab, bc, ac, count - 1, type);
    }
    else { // draw tetrahedron at end of recursion
        triangle( a, b, c, type);
    }
}

function tetrahedron(a, b, c, d, n,type) {
    divideTriangle(a, b, c, n, type);
    divideTriangle(d, c, b, n, type);
    divideTriangle(a, d, b, n, type);
    divideTriangle(a, c, d, n, type);
}



window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
     gl.enable(gl.DEPTH_TEST);
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

     texCube();

    //--------------wingRight1_1
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide,wingColor);
    //--------------wingRight1_2
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide,bodyColor);


    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(colorArray),gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program,"vColor");
    gl.vertexAttribPointer(vColor,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vColor);

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    document.getElementById("Button0").onclick = function(){theta += dr;};
    document.getElementById("Button1").onclick = function(){theta -= dr;};
    document.getElementById("Button2").onclick = function(){phi += dr;};
    document.getElementById("Button3").onclick = function(){phi -= dr;};

    document.getElementById("Button4").onclick = function(){
        if(!startFlap){
            startFlap = true;
        }else{
            startFlap = false;
        }
    };

    var image = document.getElementById("texImage");
    configureTexture0(image);

    var image1 = document.getElementById("texImage2");
    configureTexture1(image1);

    render();
}

function wingsL1_1(){
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

     for( var i=0; i<index/2; i+=3) 
       gl.drawArrays( gl.LINE_LOOP, i+ numVertices, 3 );
}
function wingsL1_2(){
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

     for( var i=0; i<index/2; i+=3) 
       gl.drawArrays( gl.LINE_LOOP, i + numVertices, 3 );
}
function body(){

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

    for( var i=index/2; i<index; i+=3) 
       gl.drawArrays( gl.TRIANGLES, i+ numVertices, 3 );

}
function wingsR1_1(){
    
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

     for( var i=0; i<index/2; i+=3) 
       gl.drawArrays( gl.LINE_LOOP, i+ numVertices, 3 );
}
function wingsR1_2(){

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

     for( var i=0; i<index/2; i+=3) 
       gl.drawArrays( gl.LINE_LOOP, i+ numVertices, 3 );
}
function antennaR1(){
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

    for( var i=index/2; i<index; i+=3) 
       gl.drawArrays( gl.LINE_LOOP, i+ numVertices, 3 );
}
function antennaR2(){
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

     for( var i=index/2; i<index; i+=3) 
       gl.drawArrays( gl.LINE_LOOP, i+ numVertices, 3 );
}
function antennaRC(){
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

     for( var i=0; i<index/2; i+=3)  
       gl.drawArrays( gl.LINE_LOOP, i+ numVertices, 3 );
}
function antennaL1(){

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

     for( var i=index/2; i<index; i+=3) 
       gl.drawArrays( gl.LINE_LOOP, i+ numVertices, 3 );
}
function antennaL2(){

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

     for( var i=index/2; i<index; i+=3)  
       gl.drawArrays( gl.LINE_LOOP, i+ numVertices, 3 );
}
function antennaLC(){
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //调用并设置球体纹理
    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disableVertexAttribArray(vTexCoord);

      for( var i=0; i<index/2; i+=3) 
       gl.drawArrays( gl.LINE_LOOP, i+ numVertices, 3 );
}
function wingFlapControl(control){
    if(startFlap){
        switch(control){
            case 1:
            {
                if(turn){
            
        flap += 1;
        if(flap >= 70){
            turn = false;
        }
    }else{
        flap -= 1;
        if(flap <= -50){
            turn = true;
        }
    }
            break;
        }
        case 2:{
            if(!turn){
        flap2 += 1;
        if(flap2 >= 50){
            turn = false;
        }
    }else{
        flap2 -= 1;
        if(flap2 <= -70){
            turn = true;
        }
    }
            break;
        }
        case 3:{
            if(turnl){
        flap3 += 1;
        if(flap3 >= 70){
            turnl = false;
        }
    }else{
        flap3 -= 1;
        if(flap3 <= -50){
            turnl = true;
        }
    }
            break;
        }
        case 4:{
            if(!turnl){
        flap4 += 1;
        if(flap4 >= 50){
            turnl = false;
        }
    }else{
        flap4 -= 1;
        if(flap4 <= -70){
            turnl = true;
        }
    }
            break;
        }
    }
}
}
function butterFlyOne(){

    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    mvStack.push(modelViewMatrix);

    //body的矩阵变换
    modelViewMatrix = mult(modelViewMatrix,translate(0,-0.3,0));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.2,0.6,0.1));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,0.5));
    body();
   
    //
    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,rotateZ(-20));
    wingFlapControl(1);
    modelViewMatrix = mult(modelViewMatrix,rotateY(flap));
    modelViewMatrix = mult(modelViewMatrix,translate(1.0,-0.3,0.0));
    modelViewMatrix = mult(modelViewMatrix,translate(-0.3,0.0,0.0));
    modelViewMatrix = mult(modelViewMatrix,scalem(1,0.3,0.01));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,1));
    wingsL1_1();

    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,rotateZ(20));
    wingFlapControl(1);
    modelViewMatrix = mult(modelViewMatrix,rotateY(flap));
    modelViewMatrix = mult(modelViewMatrix,translate(0.8,-0.4,0.0));
    modelViewMatrix = mult(modelViewMatrix,translate(-0.2,0.1,0.0));  
    modelViewMatrix = mult(modelViewMatrix,scalem(0.6,0.2,0.01));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,1));
    wingsL1_2(); 

    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,rotateZ(20));
    wingFlapControl(2);
    modelViewMatrix = mult(modelViewMatrix,rotateY(flap2));
    modelViewMatrix = mult(modelViewMatrix,translate(-1.0,-0.3,0.0));
    modelViewMatrix = mult(modelViewMatrix,translate(0.3,0.0,0.0));
    modelViewMatrix = mult(modelViewMatrix,scalem(-1,0.3,0.01));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,1));
    wingsR1_1();

    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,rotateZ(-20));
    wingFlapControl(2);
    modelViewMatrix = mult(modelViewMatrix,rotateY(180+flap2));
    modelViewMatrix = mult(modelViewMatrix,translate(0.8,-0.4,0.0));
    modelViewMatrix = mult(modelViewMatrix,translate(-0.2,0.1,0.0));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.6,0.2,0.01));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,1));
    wingsR1_2();

    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,translate(0.08,0.45,0));
    modelViewMatrix = mult(modelViewMatrix,translate(0.0,-0.25,0.0));
    modelViewMatrix = mult(modelViewMatrix,rotateZ(15));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.01,0.2,0.01));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,1));
    antennaR1();

    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,translate(0.21,0.75,0));
    modelViewMatrix = mult(modelViewMatrix,translate(-0.03,-0.3,0.0));
    modelViewMatrix = mult(modelViewMatrix,rotateZ(30));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.01,0.2,0.01));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,1));
    antennaR2();

    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,translate(0.33,0.94,0));
    modelViewMatrix = mult(modelViewMatrix,translate(-0.06,-0.35,0.0));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.02,0.02,0.02));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,0.7));
    antennaRC();

    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,translate(-0.08,0.45,0));
    modelViewMatrix = mult(modelViewMatrix,translate(0.0,-0.25,0.0));
    modelViewMatrix = mult(modelViewMatrix,rotateZ(-15));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.01,0.2,0.01));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,1));
    antennaL1();

    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,translate(-0.21,0.75,0));
    modelViewMatrix = mult(modelViewMatrix,translate(0.03,-0.3,0.0));
    modelViewMatrix = mult(modelViewMatrix,rotateZ(-30));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.01,0.2,0.01));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,1));
    antennaL2();

    modelViewMatrix = mvStack.pop();
    mvStack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix,translate(-0.33,0.94,0));
    modelViewMatrix = mult(modelViewMatrix,translate(0.06,-0.35,0.0));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.02,0.02,0.02));
    modelViewMatrix = mult(modelViewMatrix,scalem(0.7,0.7,0.7));
    antennaLC();
}

function cube(){
     eye = vec3(radius*Math.sin(0.0)*Math.cos(0.0), 
        radius*Math.sin(0.0)*Math.sin(0.0), radius*Math.cos(0.0));
     // eye = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        // radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(-2.0, 2.0, 2.0, -2.0, -10, 10);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    gl.uniform1i(gl.getUniformLocation(program, "bTexCoord"), 1);
    gl.activeTexture(gl.TEXTURE1);

    gl.enableVertexAttribArray(vTexCoord);

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    cube();

    butterFlyOne();


    window.requestAnimFrame(render);


}
