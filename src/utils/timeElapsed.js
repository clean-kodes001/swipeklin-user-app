export const timeElapsed = (
                          time = new Date(),
                          type = null
                        ) => {

  const startDateTime = new Date(time);
  var startStamp = startDateTime.getTime();

  var newDate = new Date();
  var newStamp = newDate.getTime();

  var timer;

  function updateClock() {
      newDate = new Date();
      newStamp = newDate.getTime();
      var diff = Math.round((newStamp-startStamp)/1000);
      
      var d = Math.floor(diff/(24*60*60));
      diff = diff-(d*24*60*60);
      var h = Math.floor(diff/(60*60));
      diff = diff-(h*60*60);
      var m = Math.floor(diff/(60));
      diff = diff-(m*60);
      var s = diff;

      const humanReadable = (time, type) => {
        if(time === 0) return null;
        if(type === 'd') return `${time.toFixed()} day${(time>1&&'s')}`;
        if(type === 'h') return `${time.toFixed()} hr${(time>1&&'s')}`;
        if(type === 'm') return `${time.toFixed()} min${(time>1&&'s')}`;
        if(type === 's') return `${time.toFixed()} sec${(time>1&&'s')}`;
      }
      const timerReadable = (time) => {
        if(time < 1) return null;//'00';
        if(time < 10) return `0${time.toFixed()}`;
        else return `${time.toFixed()}`;
      }
      
      if(type == 'words')
      return `${humanReadable(d, 'd') && (humanReadable(d, 'd') + ' :')} ${humanReadable(h, 'h') && (humanReadable(h, 'h') + ' :')} ${humanReadable(m, 'm') && (humanReadable(m, 'm') + ' :')} ${humanReadable(s, 's') && humanReadable(s, 's')}`;
      else
      return `${timerReadable(d) ? (timerReadable(d) + ' :') : ''} ${timerReadable(h) ? timerReadable(h) : '00'} : ${timerReadable(m) ? timerReadable(m) : '00'} : ${timerReadable(s) ? timerReadable(s) : '00'}`;
  };

  setInterval(updateClock, 1000);
  
  return updateClock();
};