const DAGER = ['Måndag', 'Tysdag', 'Onsdag', 'Torsdag', 'Fredag', 'Laurdag', 'Søndag'];
const DAGER_BOKMAL = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
let parse = parseCSV('\t');
let eventsURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT3xJC11F5tBLqNYTETN8hAdqBy0OV3vTMt6VjdLLVcvGi_yo0N2fSp8FY9SRFhaI-Pr-FzYnc86Ycj/pub?gid=0&single=true&output=tsv';
let EVENTS = getURL(eventsURL).then(parse)/*.then(e=>{console.log(e);return e})*/.catch(console.error);
let TODAY = new Date();


window.onload = async function () {
  let startDate = getNextWednesday(TODAY);

  findRelevantEvents(startDate);

  let input = <HTMLInputElement> document.getElementById('startdate');
  if(input) input.addEventListener('change', function() {
    if(input) {
      let date = getNextWednesday(new Date(input.value));
      findRelevantEvents(date);
      input.valueAsDate = date;

      let clipboardBTN = <HTMLElement> document.getElementById('clipBTN');
      clipboardBTN.textContent = 'Kopier til utklippstavle';
      clipboardBTN.classList.remove('clipboarded');
    }
  });
};

async function findRelevantEvents(startDate:Date, endDate?:Date) {
  let startDateLimit = startDate;
  let endDateLimit = dateOrDefault(endDate, startDate);


  let dates = [];
  let currentDate = startDateLimit;

  while(currentDate.valueOf() <= endDateLimit.valueOf()) {
    dates.push(currentDate);
    currentDate = new Date(currentDate.valueOf());
    currentDate.setDate(currentDate.getDate() + 1);
  }

  let events = await EVENTS;
  if(!events) return;

  let weeklies:any[][] = [];
  events.filter(evt => DAGER_BOKMAL.indexOf(evt[3]) > -1)
    .forEach(evt => {
      let day:number = DAGER_BOKMAL.indexOf(evt[3]);
      let currentDay:number = (startDateLimit.getDay() + 6) % 7; // +6%7 makes monday first day
      let dayHasPassed:boolean = day < currentDay;

      let upcomingEvt:any[] = [evt[0], evt[1], null, null, evt[4]];
      let nextWeekEvt:any[] = [evt[0], evt[1], null, null, evt[4]];

      // if day has passed, add 7 subtract the difference
      upcomingEvt[3] = new Date(startDateLimit.getTime() +
        (day - currentDay + (dayHasPassed ? 7 : 0)) * 24*60*60*1000);
      weeklies.push(upcomingEvt);

      // this is hackish but it works without breaking my brain
      nextWeekEvt[3] = new Date(startDateLimit.getTime() +
      (day - currentDay + (7 + (dayHasPassed ? 7 : 0))) * 24*60*60*1000);
      weeklies.push(nextWeekEvt);
    });

  console.log('trying to map and filter')
  let filteredEvts = events
    .filter(evt => evt[0] != '')
    .map(parseDateInArray(3))
    .map(e => { console.log(e); return e; })
    .filter(evt => evt[3] instanceof Date)
    .filter(evt => (<Date> evt[3]).valueOf() > startDateLimit.valueOf())
    .filter(evt => (<Date> evt[3]).valueOf() < endDateLimit.valueOf())
    .concat(weeklies)
    .concat(dates)
    .sort((a:any[] | Date, b:any[] | Date) => {
      let date_a = a instanceof Array ? a[3].valueOf() : a.valueOf() - 1;
      let date_b = b instanceof Array ? b[3].valueOf() : b.valueOf() - 1;
      return Math.sign(date_a - date_b);
    });

  let wrapper = <HTMLElement> document.getElementById('generated');

  while(wrapper.firstChild) {
    wrapper.removeChild(wrapper.firstChild);
  }

  filteredEvts.map(evt => drawListItemFromEvent(evt))
    .forEach(elem => wrapper.appendChild(elem));

}

function drawListItemFromEvent(evt: any[] | Date):DocumentFragment {
  let wrapper = document.createDocumentFragment();

  if(evt instanceof Array) {
    let time = evt[4] === '' ? '' : ', ' + evt[4].replace(':', '.');

    // let title = document.createElement('h3');
    // title.style.fontSize = '1em';
    // title.style.fontFamily = "'roboto', sans-serif";
    // let title_inner = document.createElement('b');
    // title_inner.textContent = evt[0];
    // title.appendChild(title_inner);
    // wrapper.appendChild(title);

    let details = document.createElement('p');

    let title = document.createElement('span');
    title.style.fontSize = '1em';
    title.style.fontFamily = "'roboto', sans-serif";
    title.style.fontWeight = "bold";
    title.textContent = evt[0];
    details.appendChild(title);

    details.appendChild(document.createElement('br'));

    let placeTime = document.createElement('span');
    placeTime.style.textDecoration = 'underline';
    placeTime.style.fontSize = '1em';
    placeTime.style.fontFamily = "'roboto', sans-serif";
    placeTime.textContent = evt[1].trim() + time;
    details.appendChild(placeTime);

    wrapper.appendChild(details);

  } else {
    let time = document.createElement('h2');
    time.textContent = DAGER[(evt.getDay() + 6) % 7] + ' ' + leadingZero(evt.getDate());
    time.style.fontFamily = "'roboto', sans-serif";
    wrapper.appendChild(time);
  }

  return wrapper;
}

function getURL(url: string): Promise<any> {
  return new Promise(function(resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          resolve(xhr.responseText);
        } else {
          reject(xhr.status + ' ' + xhr.statusText);
        }
      }
    }
    xhr.send(null);
  });
}

function parseCSV(delimeter: string) {
  return function(csv: string) {
    let rows;
    rows = csv.split(/\r\n|\n/gi);
    rows.shift()
    rows = rows.filter(e => e !== undefined).map(row => row.split(delimeter));
    return rows;
  }
}

function dateOrDefault(end:Date | undefined, start:Date):Date {
  if(end) return end;

  let newDate = new Date(start.valueOf());
  newDate.setDate(start.getDate() + 14);
  return newDate;
}

function parseDateInArray(n:number): (arr:any[]) => any[] {
  return function (arr:any[]): any[] {
    if(typeof arr[n] == 'string' && arr[n].match(/\d\d\.\d\d\.\d{4}/)) {
      let d:number[] = (<string> arr[n]).trim().split('.').map(n => +n);
      arr[n] = new Date(d[2], d[1]-1, d[0]);
    }
    return arr;
  }
}

function getNextWednesday(date?:Date):Date {
  let nextWednesday = date || new Date();
  let day = nextWednesday.getDay();
  if (day <= 3) {
    nextWednesday.setDate(nextWednesday.getDate() + (3 - nextWednesday.getDay()));
  } else {
    nextWednesday.setDate((nextWednesday.getDate() - (day + 6) % 7) + 2 + 7);
  }
  return nextWednesday;
}

function copyToClip(str:string) {
  function listener(e:any) {
    e.clipboardData.setData("text/html", str);
    e.clipboardData.setData("text/plain", str);
    e.preventDefault();
  }
  document.addEventListener("copy", listener);
  document.execCommand("copy");
  document.removeEventListener("copy", listener);
}

function leadingZero(n:number):string {
  return '' + (n > 9 ? n : '0' + n);
}
