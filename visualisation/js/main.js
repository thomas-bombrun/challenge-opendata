
var canvas, ctx;
var canvas2, ctx2;
var chrono = Date.now();
var mousePos;
var dataGlobal;
var GroupeEncadre;
var GroupeClique;
var marginWriting = 143; // in pixels
var rxGlobal ;
var ryGlobal ;


var oldTopGroup = null;
var oldRightGroup = null;

function writeTopGroupName(context,group,color,shouldEraseOldGroup) {
    if(shouldEraseOldGroup && oldTopGroup) {
        writeTopGroupName(context,oldTopGroup,"black",false)
    }
    context.save();
    context.font="10px Arial";
    context.textAlign = "start";
    context.textBaseline= "middle";
    context.fillStyle = color;
    var middlePoint = group.begin+(group.end-group.begin)/2;
    context.translate(middlePoint,-5);
    context.rotate(-Math.PI/5);
    context.clearRect(0,-6,500,12);
    context.fillText(group.name, 0, 0);
    context.restore();
    oldTopGroup = group;
}

function writeRightGroupName(context,group,color,shouldEraseOldGroup) {
    if(shouldEraseOldGroup && oldRightGroup) {
        writeRightGroupName(context,oldRightGroup,"black",false)
    }
    context.save();
    context.font="10px Arial";
    context.textAlign = "start";
    context.textBaseline="middle";
    context.fillStyle = color;
    var middlePoint = Math.floor(group.begin+(group.end-group.begin)/2);
    context.translate(575+5,middlePoint);
    context.clearRect(0,-10,500,20);
    context.fillText(group.name,0,0);
    context.restore();
    oldRightGroup = group;
}

function writeGroupsName(context,groups) {
    for (var i = groups.length - 1; i >= 0; i--) {
        writeTopGroupName(context,groups[i],"black",false);
    };
    for (var i = groups.length - 1; i >= 0; i--) {
        writeRightGroupName(context,groups[i],"black",false);
    };
}

function init() {

    canvas = document.getElementById("CanvasPrincipal");
    ctx = canvas.getContext("2d");

    canvas2 = document.getElementById("CanvasSecondaire");
    ctx2 = canvas2.getContext("2d");

    // mouse events

    canvas.addEventListener('mousemove', mouseMoving);

    canvas.addEventListener('click', mouseClicking);

    canvas2.addEventListener('click', deputeClicking);

    ctx.clearRect(0,0,canvas.width,canvas.height);

    $.getJSON("data.json", function(data) {
    	console.log("json loaded in : " +(Date.now()-chrono));
    	chrono = Date.now();
    	dataGlobal=data;
        ctx.translate(0,marginWriting);
        writeGroupsName(ctx,data.groups);
        oldTopGroup = null;
        oldBottomGroup = null;
        drawMatrix(dataGlobal);
    });

}

function findGroup(x) {
    for (var i = dataGlobal.groups.length - 1; i >= 0; i--) {
	var group =dataGlobal.groups[i];
	if ((x <= group.end) && (x >= group.begin)){
            return i;
        }
    };
    return null;
}



function differentGroupe(GroupeEncadre,groupX,groupY){

    return GroupeEncadre.beginX!==groupX.begin
        || GroupeEncadre.beginY!==groupY.begin
        || GroupeEncadre.endX!==groupX.end
	|| GroupeEncadre.endY!==groupY.end
}


function changeColorRect(x,y,width,height,color,context){
    if( (x<0) || (y<0) || (x+width>576) || (y+height>576) ) {
        return ;
    }
    //getImgData prend la valeur absolu, il faut donc ajouter la marge
    var imgData=context.getImageData(x,y+marginWriting,width,height);

    for (var i=0;i<imgData.data.length;i+=4) {
        var colorHSV = rgbToHsv( imgData.data[i], imgData.data[i+1], imgData.data[i+2]);

        if (color=="erase"){
            colorHSV[1]=0;
        } else if (color=="add"){
            colorHSV[0]=0.333;
            colorHSV[1]=1;
        }

        var colorRGB = hsvToRgb(colorHSV[0],colorHSV[1],colorHSV[2]);
        imgData.data[i]=colorRGB[0];
        imgData.data[i+1]=colorRGB[1];
        imgData.data[i+2]=colorRGB[2];
        imgData.data[i+3]=255;
    }
    //putImgData prend la valeur absolu, il faut donc ajouter la marge
    context.putImageData(imgData,x,y+marginWriting);
}

function AddColorRect(x,y,width,height,color,context){

    var deputeX = Math.floor(x/rxGlobal);
    var deputeY = Math.floor(y/ryGlobal);
    var deputeXScale = deputeX*rxGlobal;
    var deputeYScale = deputeY*ryGlobal;

    //getImgData prend la valeur absolu, il faut donc ajouter la marge
    var imgData=context.getImageData(deputeXScale,deputeYScale,width,height);
    
    for (var i=0;i<imgData.data.length;i+=4) {
        var colorHSV = rgbToHsv( imgData.data[i], imgData.data[i+1], imgData.data[i+2]);
        if (color=="erase"){
            colorHSV[1]=0;
        } else if (color=="add"){
            colorHSV[0]=0.333;
            colorHSV[1]=1;
        }

        var colorRGB = hsvToRgb(colorHSV[0],colorHSV[1],colorHSV[2]);
        imgData.data[i]=colorRGB[0];
        imgData.data[i+1]=colorRGB[1];
        imgData.data[i+2]=colorRGB[2];
        imgData.data[i+3]=255;
    }
    //putImgData prend la valeur absolu, il faut donc ajouter la marge
    context.putImageData(imgData,deputeXScale,deputeYScale);
}


function drawContour(GroupeEncadre,color){

    //carre de gauche
    changeColorRect(GroupeEncadre.beginX-2,GroupeEncadre.beginY,2,(GroupeEncadre.endY-GroupeEncadre.beginY),color,ctx);
    //carre au dessus
    changeColorRect(GroupeEncadre.beginX,GroupeEncadre.beginY-2,(GroupeEncadre.endX-GroupeEncadre.beginX),2,color,ctx);
    //carre en dessous

    changeColorRect(GroupeEncadre.beginX,GroupeEncadre.endY,(GroupeEncadre.endX-GroupeEncadre.beginX),2,color,ctx);
    //carre de droite
    changeColorRect(GroupeEncadre.endX,GroupeEncadre.beginY,2,(GroupeEncadre.endY-GroupeEncadre.beginY),color,ctx);

}

function mouseMoving(evt) {
    mousePos = getMousePos(canvas, evt);
    var groupIdX = findGroup(mousePos.x);
    var groupIdY = findGroup(mousePos.y);
    var groupX = dataGlobal.groups[groupIdX];
    var groupY = dataGlobal.groups[groupIdY];
    if(!groupX || !groupY){
        return;
    }
    if (!GroupeEncadre) {
	GroupeEncadre={"beginX":groupX.begin,
	    	       "endX":groupX.end,
	    	       "beginY":groupY.begin,
	    	       "endY":groupY.end
	              };
	drawContour(GroupeEncadre,"add");
    } else if (differentGroupe(GroupeEncadre,groupX,groupY)) {
        drawContour(GroupeEncadre,"erase");
    	GroupeEncadre={"beginX":groupX.begin,
	    	       "endX":groupX.end,
	    	       "beginY":groupY.begin,
	    	       "endY":groupY.end
	              };
	drawContour(GroupeEncadre,"add");
        writeTopGroupName(ctx,groupX,"red",true);
        writeRightGroupName(ctx,groupY,"red",true);
    }
}


function deputeClicking(evt) {

    mousePos = getMousePosOriginal(canvas2, evt);


    console.log(mousePos.x+" "+mousePos.y);
    var deputeX = Math.floor(mousePos.x/rxGlobal);
    console.log(dataGlobal.depute[deputeX+GroupeClique.beginX].name);
     var deputeY = Math.floor(mousePos.y/ryGlobal);

    console.log(dataGlobal.depute[deputeY+GroupeClique.beginY].name);

    createDeputeCard(dataGlobal.depute[deputeY+GroupeClique.beginY],true)
    createDeputeCard(dataGlobal.depute[deputeX+GroupeClique.beginX],false)


}

function mouseClicking(evt) {
    // créer une nouvelle matrix uniquement pour le parti du député sélectionné
    ctx2.clearRect(0,0,canvas2.width,canvas2.height);

    var groupIdX = findGroup(mousePos.x);
    var groupIdY = findGroup(mousePos.y);
    var groupX = dataGlobal.groups[groupIdX];
    var groupY = dataGlobal.groups[groupIdY];


    GroupeClique={"beginX":groupX.begin,
                   "endX":groupX.end,
                   "beginY":groupY.begin,
                   "endY":groupY.end
                  };

     rxGlobal = canvas2.width/(dataGlobal.groups[groupIdX].end-dataGlobal.groups[groupIdX].begin);
     ryGlobal = canvas2.height/(dataGlobal.groups[groupIdY].end-dataGlobal.groups[groupIdY].begin);
    drawMatrix2(dataGlobal, rxGlobal, ryGlobal, groupIdX, groupIdY, ctx2);
}

function drawMatrix2(tab, rx, ry, parti1, parti2, context) {

    var first1 = tab.groups[parti1].begin;
    var end1 = tab.groups[parti1].end;
    var first2 = tab.groups[parti2].begin;
    var end2 = tab.groups[parti2].end;




    for (var i = tab.links[parti1][parti2].length-1; i >=0; i--) {
        var link = tab.links[parti1][parti2][i];
        var color = Math.floor(44.6897827339*Math.log(link.value/3+1))/255;
        var colortab=hsvToRgb(0.3333,0,color);

        var x = link.source;
        var y = link.target;

        context.fillStyle = "rgb("+colortab[0]+","+colortab[1]+","+colortab[2]+")";

        if (first1 > first2) {
            if ((x>y)) {
                context.fillRect((x-first1)*rx, (y-first2)*ry, rx, ry);

            } else {
                context.fillRect((y-first1)*rx, (x-first2)*ry, rx, ry);
            }

        }else if (first1 < first2) {
            if ((y>x)) {
               context.fillRect((x-first1)*rx, (y-first2)*ry, rx, ry);

            } else {
                context.fillRect((y-first1)*rx, (x-first2)*ry, rx, ry);
            }
        }else{

            context.fillRect((x-first1)*rx, (y-first2)*ry, rx, ry);
            context.fillRect((y-first2)*rx, (x-first1)*ry, ry, rx);
        }

    }


}

function getMousePosOriginal(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
    	x: evt.clientX - rect.left,
    	y: evt.clientY - rect.top - marginWriting
    };
}

function rgbToHsv(r, g, b){
    r = r/255, g = g/255, b = b/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{
        switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, v];
}

function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}



function drawMatrix(tab) {
    var nb = tab.depute.length;
    for (var i = tab.links.length - 1; i >= 0; i--) {
    	for (var j = tab.links[i].length - 1; j >= 0; j--) {
    	    for (var k = tab.links[i][j].length - 1; k >= i; k--) {

    		var link=tab.links[i][j][k];
           // var color =(link.value)/850;
           var color = Math.floor(44.6897827339*Math.log(link.value/3+1))/255;
            
	    	//var color = Math.floor(37.48*Math.log(link.value+1))/255;
	    	var colortab=hsvToRgb(0.3333,0,color);


	    	var x = link.source;
	    	var y = link.target;

	    	ctx.fillStyle = "rgb("+colortab[0]+","+colortab[1]+","+colortab[2]+")";
	    	ctx.fillRect(x, y, 1, 1);
	    	ctx.fillRect(y, x, 1, 1);

	    }
	}
    }
    console.log("matrix drawn in : " +(Date.now()-chrono));
}

function createDeputeCard(depute,isX) {
    var groupName = dataGlobal.groups[depute.group].name;
    var groupeDescription = "Député"+(depute.is_male?"":"e")+
                                (groupName==="Non inscrit"?
                                    " non inscrit"+(depute.is_male?"":"e")
                                    :" du groupe \""+groupName+"\"");
    if(isX) {
        $('#x-card-name').text(depute.name)
        $('#x-card-group').text(groupeDescription)
        $('#x-card-name').attr("href","https://fr.wikipedia.org/w/index.php?search="+depute.name).html();
        $('#x-card-img').attr("src","http://www2.assemblee-nationale.fr/static/tribun/14/photos/"+depute.id+".jpg");

    } else {
        $('#y-card-name').text(depute.name)
        $('#y-card-group').text(groupeDescription)
        $('#y-card-name').attr("href","https://fr.wikipedia.org/w/index.php?search="+depute.name).html();
        $('#y-card-img').attr("src","http://www2.assemblee-nationale.fr/static/tribun/14/photos/"+depute.id+".jpg");
    }
}
