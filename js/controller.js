//global vars
var npslogtype = undefined;

const holder = document.getElementById('main');
  holder.ondragover = () => {
    return false;
  }
  holder.ondragleave = holder.ondragend = () => {
    return false;
  }
  holder.ondrop = (e) => {
    e.preventDefault()
    for (let f of e.dataTransfer.files)
    {
      console.log('File(s) you dragged here: ', f.path)
      parseFile(f.path)
    }
    return false;
  }

findNPSLogs();

function findNPSLogs()
{
    var glob = require("glob")

    glob("C:\\Windows\\System32\\LogFiles\\IN*.log", function (er, files)
    {
        if(files.length>0)
        {
            if(files[0].length==10)
                npslogtype = 'monthly';
            else if(files[0].length==12)
                npslogtype = 'daily';
            for(var i=0;i<files.length;i++)
            {
                var parts = files[i].split('/');
                var filename = parts[parts.length-1].substring(0,parts[parts.length-1].indexOf('.log'));
                var year = "20"+filename.substr(2,2);
                var month = getMonthName(parseInt(filename.substr(4,2)));
                var day = (npslogtype=='daily'?filename.substr(6,2):'');
                //console.log(year+" "+month+" "+day);

                $("#controls").append('<button class="btn btn-info" onClick="parseFile(\''+ files[i] +'\');">'+ month + " "+ year + " "+ day +'</button>');
            }
        }
    })
}

function prepareCharts()
{
    $("#charts").html('<div class="row">\
                            <div class="col-md-8">\
                                <h3>Connections by RADIUS Client</h3>\
                                <canvas id="byAP" style="width:100%;" height="300"></canvas>\
                            </div>\
                            <div class="col-md-4">\
                                <h3>Successful vs unsuccessful attempts</h3>\
                                <canvas id="bySuccess" width="400" height="400"></canvas>\
                            </div>\
                        </div>\
                        <div >\
                            <h3>Connections by Hour</h3>\
                            <canvas id="byHour" style="width:100%;" height="250"></canvas>\
                        </div>\
                        <div>\
                            <h3>Connections by day</h3>\
                            <canvas id="byDay" style="width:100%;" height="250"></canvas>\
                        </div>\
                        ');
}

function getSpinner(withtext)
{
    return (withtext===true?'<h3 class="text-center">Loading.. </h3>':'')+'<div class="sk-cube-grid">\
                <div class="sk-cube sk-cube1"></div>\
                <div class="sk-cube sk-cube2"></div>\
                <div class="sk-cube sk-cube3"></div>\
                <div class="sk-cube sk-cube4"></div>\
                <div class="sk-cube sk-cube5"></div>\
                <div class="sk-cube sk-cube6"></div>\
                <div class="sk-cube sk-cube7"></div>\
                <div class="sk-cube sk-cube8"></div>\
                <div class="sk-cube sk-cube9"></div>\
            </div>';
}