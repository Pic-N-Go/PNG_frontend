const fs = require('fs');

let content = fs.readFileSync('src/html/filelist.html', 'utf8');

const tbodyStart = content.indexOf('<tbody>');
const tbodyEnd = content.indexOf('</tbody>');
let tbody = content.slice(tbodyStart, tbodyEnd);

const rows = tbody.split('<tr>');
for (let i = 1; i < rows.length; i++) {
  let row = rows[i];
  if (row.includes('<td>마이페이지</td>')) {
    // Only replace when UI is 미시작 and API status is 완료
    if (row.includes('<td><span class="status status--todo">미시작</span></td>') && row.includes('<td><span class="status status--done">완료</span></td>')) {
      if (row.includes('<td>이예인</td>')) {
        row = row.replace('<td>이예인</td>', '<td>모정민</td>');
      }
      row = row.replace('<td><span class="status status--todo">미시작</span></td>', '<td><span class="status status--done">완료</span></td>');
    }
  } else if (row.includes('<td>위시리스트</td>')) {
    // Only replace API status when UI status is 완료 and API status is 미시작
    if (row.includes('<td><span class="status status--done">완료</span></td>') && row.includes('<td><span class="status status--todo">미시작</span></td>')) {
      const lastDoneIdx = row.lastIndexOf('<td><span class="status status--done">완료</span></td>');
      if (lastDoneIdx !== -1) {
        row = row.substring(0, lastDoneIdx) + '<td><span class="status status--todo">미시작</span></td>' + row.substring(lastDoneIdx + '<td><span class="status status--done">완료</span></td>'.length);
      }
    }
  }
  rows[i] = row;
}

content = content.slice(0, tbodyStart) + rows.join('<tr>') + content.slice(tbodyEnd);
fs.writeFileSync('src/html/filelist.html', content);
console.log('Update complete');
