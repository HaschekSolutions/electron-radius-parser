var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream');

function parseFile(file)
{
    if(tail!==undefined)
        tail.unwatch();
    console.log("parsing file "+file);
    $('a[href="#graphs"]').tab('show');
    $("#charts").html(getSpinner(true));
    $("#errors").html("");
    var instream = fs.createReadStream(file);
    var outstream = new stream;
    outstream.readable = true;
    outstream.writable = true;

    var labels = [];
    var internaldata = [];
    var data = [];
    var datacount = 0;
    var linecount = 0;
    var user_labels = [];
    var user_data  = [];
    var ou_labels = [];
    var ou_data  = [];
    var success_data  = [0,0];
    var errors = [];
    var hourly_labels = [];
    var hourly_data = [];
    var daily_labels = [];
    var daily_data = [];
    var highestday = 0;
    var packages = 0;
    var users = [];
    var users_timestampdata = [];
    var failed_users = [];
    var users_by_day = [];

    tail = new Tail(file);

    tail.on("line", function(data) {
        console.log("new line: "+data);
        actOnLine(data);

        //update byAP graph
        byAP.data.datasets[0].data = data;
        byAP.data.datasets[0].labels = labels;
        byAP.update();

        //update byDay graph
        byDay.data.datasets[0].data = daily_data;
        byDay.data.labels = daily_labels;
        byDay.update();

        //update byHour graph
        byHour.data.datasets[0].data = hourly_data;
        byHour.data.labels = hourly_labels;
        byHour.update();

        //update bySuccess graph
        bySuccess.data.datasets[0].data = success_data;
        bySuccess.update();
    });

    var rl = readline.createInterface({
        input: instream,
        output: outstream,
        terminal: false
    });

    rl.on('close', function() {
        tail.unwatch();
        console.log('finished. Soo many packages: '+packages);
        console.log('highest day: '+highestday)

        for(var i=1;i<=(highestday+1);i++)
        {
            daily_labels[daily_labels.length] = i;
        }

        for(var i=0;i<=23;i++)
        {
            hourly_labels[hourly_labels.length] = i;
        }

        prepareCharts();
        renderByAP(labels,data);
        renderSuccess(success_data);
        renderErrorTable(errors);
        renderByDay(daily_labels, daily_data)
        renderTimeline(hourly_labels,hourly_data);

        //console.log(users_timestampdata);
        renderUsersTable(users,users_timestampdata);


        $( ".userinfo" ).click(function() {
            var user = $(this).text();
            var data = users_by_day[user];
            console.log(data);

            var content = "<h2>Daily info about: <strong>"+user+"</strong></h2><div class=\"table-responsive table-striped\"><table class=\"table\">"
            var day = 1;
            for(i=0; i<5; i++){
                content += '<tr>';
                for(j=0; j<7; j++){
                    if(day>31) continue;
                    if(data[day]!==undefined)
                        content+= '<td style="height:50px;background-color:#0099e6;">' + 'day ' +  day + '</td>';
                    else
                        content+= '<td style="height:50px;">' + 'day ' +  day + '</td>';
                    day++;
                }
                content += '</tr>';
            }
            content += "</table></div>"

            $("#userview").html(content);
          });
    });

    function actOnLine(line)
    {
        var parsed = parseNPSLine(line);
        if(!parsed) return;
        packages++;

        var day = parsed.timestamp.getUTCDate();
        if(parsed.user!==false)
        {
            if(users_by_day[parsed.user]===undefined)
            users_by_day[parsed.user] = [];
            users_by_day[parsed.user][day] = 1;
        }

        if(parsed.ou!==undefined)
        {
            var labelindex = ou_labels.indexOf(parsed.ou)
            if(labelindex==-1)
            {
                labelindex = ou_labels.length;
                ou_labels[labelindex] = parsed.ou;
            }
            if(ou_data[labelindex]==NaN || ou_data[labelindex] == undefined)
                ou_data[labelindex] = 0;
            ou_data[labelindex]++;
        }

        //saving ap data
        var labelindex = labels.indexOf(parsed.ap_radname)
        if(labelindex==-1)
        {
            labelindex = labels.length;
            labels[labelindex] = parsed.ap_radname;
        }
        if(data[labelindex]==NaN || data[labelindex] == undefined)
            data[labelindex] = 0;
        data[labelindex]++;

        //saving hourly data
        var index = parsed.timestamp.getHours();//parseInt(parsed.timestamp.getUTCDate()+1);
        if(hourly_data[index]==NaN || hourly_data[index]==undefined)
            hourly_data[index] = 0;
        hourly_data[index]++;

        //saving daily data
        var index = parseInt(parsed.timestamp.getUTCDate())-1//parseInt(parsed.timestamp.getUTCDate()+1);
        if(daily_data[index]==NaN || daily_data[index]==undefined)
            daily_data[index] = 0;
        daily_data[index]++;

        if(highestday==0)
        {
            //console.log("timestamp",parsed.timestamp);
            var month = parseInt(parsed.date.split('/')[0])-1;
            var d = new Date(parsed.timestamp.getFullYear(), month + 1, 0);
            console.log(d)
            console.log(d.getUTCDate())
            highestday = d.getUTCDate();
        }
            

        //console.log(date+" "+time);

        switch(parseInt(parsed.type))
        {
            case 1: //Requesting access
                
            break;
            case 2: //Accepted
                //console.log(origin+" is accepted on "+ ap_radname);
                //echo "$origin is accepted on $ap_radname_full\n\n";
                success_data[1]++;

                //saving connected user data
                var index = parsed.user
                var labelindex = users.indexOf(index)
                if(labelindex==-1)
                {
                    labelindex = users.length;
                    users[labelindex] = index;
                }
                users_timestampdata[labelindex] = parsed.timestamp;
            break;
            case 3: //Rejected
                //console.log(origin+" is rejected because "+ rs);
                //echo "$origin is rejected because: $rs\n\n";
                success_data[0]++;
                errors[errors.length] = {time:parsed.timestamp,user:parsed.origin,reason:parsed.rs,reasoncode:parsed.reason,mac:parsed.client_mac};

                //saving connected user data
                var index = parsed.user
                var labelindex = failed_users.indexOf(index)
                if(labelindex==-1)
                {
                    labelindex = failed_users.length;
                    failed_users[labelindex] = index;
                }
            break;
            case 4: //Accounting-Request
            break;
            case 5: //Accounting-Response
            break;
            case 11: //Access-Challenge
            break;
            default:
                //echo "$reason\t$origin\t$timestamp\t$client\t$tt\t$ap_radname_full\n";
        }
    }

    rl.on('line', function(line) {
        actOnLine(line);
    });
}

function renderErrorTable(data)
{
    var data = getLastNItems(data,20);
    var table = '<table class="table table-hover">';

     table+='<tr>\
                <th>Time</th>\
                <th>User</th>\
                <th>Error</th>\
             </tr>';

    for(var i=0;i<data.length;i++)
    {
        var o = data[i];
        //console.log(o);
        table+='<tr>\
                    <td>'+ o.time +'</td>\
                    <td>'+ o.user +'</td>\
                    <td>'+ o.reason +'</td>\
                </tr>\
                    ';
        //mac2vendor(o.mac);
    }

    table+='</table>';

    $("#errors").html(table)
}

function renderUsersTable(data,timestampdata)
{
    var table = '<table class="table table-hover">';

     table+='<tr>\
                <th>User</th>\
                <th>Last seen</th>\
                <th></th>\
             </tr>';

    for(var i=0;i<data.length;i++)
    {
        var o = data[i];
        //console.log(o);
        var moment = require('moment');
        //console.log(moment(timestampdata[i]).fromNow());
        var relative = moment(timestampdata[i]).fromNow()
        table+='<tr>\
                    <td><a href="#" class="userinfo">'+ o +'</a></td>\
                    <td>'+ relative +'</td>\
                    <td>'+ timestampdata[i] +'</td>\
                </tr>\
                    ';
        //mac2vendor(o.mac);
    }

    table+='</table>';

    $("#users").html('<div id="userview"></div>'+table)
}