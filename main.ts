const DAGER = ['Måndag', 'Tysdag', 'Onsdag', 'Torsdag', 'Fredag', 'Laurdag', 'Søndag'];
const DAGER_BOKMAL = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];

window.onload = async function () {
  let parse = parseCSV('\t');
  let eventsURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT3xJC11F5tBLqNYTETN8hAdqBy0OV3vTMt6VjdLLVcvGi_yo0N2fSp8FY9SRFhaI-Pr-FzYnc86Ycj/pub?gid=0&single=true&output=tsv';

  // TODO: Calculate these based on TODAY or user input
  let startDateLimit = new Date('2019-01-28');
  let endDateLimit = new Date('2019-02-11');

  let dates = [];
  let currentDate = startDateLimit;

  while(currentDate.valueOf() <= endDateLimit.valueOf()) {
    dates.push(currentDate);
    currentDate = new Date(currentDate.valueOf());
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // for (let i = 0; i < dates.length; i++) {
  //   let arr = [];
  //   arr[2] = dates[i]
  //   dates[i] = arr;
  // }

  let events = await getURL(eventsURL).then(parse).catch(console.error);
  if(!events) return;

  let weeklies = events.filter(evt => evt[])

  let filteredEvts = events.map(parseDateInArray(2))
    .filter(evt => evt[2] != NaN)
    .filter(evt => (<Date> evt[2]).valueOf() > startDateLimit.valueOf())
    .filter(evt => (<Date> evt[2]).valueOf() < endDateLimit.valueOf())
    .concat(dates)
    .sort((a:any[] | Date, b:any[] | Date) => {
      let date_a = a instanceof Array ? a[2].valueOf() : a.valueOf() - 1;
      let date_b = b instanceof Array ? b[2].valueOf() : b.valueOf() - 1;

      return Math.sign(date_a - date_b);
    })

  let wrapper = <HTMLElement> document.getElementById('content');

  filteredEvts.map(evt => drawListItemFromEvent(evt))
    .forEach(elem => wrapper.appendChild(elem));

};

function drawListItemFromEvent(evt: any[] | Date):DocumentFragment {
  let wrapper = document.createDocumentFragment();

  if(evt instanceof Array) {
    let time = evt[3] === '' ? '' : evt[3].replace(':', '.');

    let title = document.createElement('h3');
    let title_inner = document.createElement('b');
    title_inner.textContent = evt[0];
    title.appendChild(title_inner);
    wrapper.appendChild(title);

    let details = document.createElement('p');
    let details_inner = document.createElement('mark');
    details_inner.textContent = evt[1] + ', ' + time;
    details.appendChild(details_inner);
    wrapper.appendChild(details);

  } else {
    let time = document.createElement('h2');
    time.textContent = DAGER[evt.getDay() - 1];
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

function parseDateInArray(n:number): (arr:any[]) => any[] {
  return function (arr:any[]): any[] {
    if(arr[n].match(/\d\d\.\d\d\.\d{4}/)) {
      let d:number[] = (<string> arr[n]).trim().split('.').map(n => +n);
      arr[n] = new Date(d[2], d[1]-1, d[0]);
    } else {
      arr[n] = NaN;
    }
    return arr;

  }
}
