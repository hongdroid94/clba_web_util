import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { TimerData, DragonType } from './types/timer';
import Toast from './components/Toast';

// 알림음 파일 추가 필요
const ALERT_SOUND = new Audio('/alert.mp3'); 

type SortKey = 'channel' | 'killedTime' | 'dragonType' | 'respawnTime';

function App() {
  const [channelNumber, setChannelNumber] = useState<string>('');
  const [killedTime, setKilledTime] = useState<string>('');
  const [dragonType, setDragonType] = useState<DragonType>('수룡');
  const [timerList, setTimerList] = useState<TimerData[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [sortKey, setSortKey] = useState<SortKey>('killedTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 알림 권한 요청
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // 알림 표시 함수를 useCallback으로 감싸기
  const showNotification = useCallback((timer: TimerData) => {
    // 소리 재생
    ALERT_SOUND.play();

    // 토스트 메시지 표시
    showToast(`${timer.channelNumber}채널 ${timer.dragonType} 리젠 시간입니다!`);

    // 데스크톱 알림
    if (Notification.permission === 'granted') {
      new Notification('드래곤 리젠 알림', {
        body: `${timer.channelNumber}채널 ${timer.dragonType} 리젠 시간입니다!`,
        icon: '/favicon.ico'
      });
    }
  }, []);  // 빈 dependency array

  // 실시간 타이머 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerList(prevList =>
        prevList.map(timer => {
          const now = new Date();
          const timeDiff = timer.respawnTime.getTime() - now.getTime();
          
          if (timeDiff <= 0 && !timer.isCompleted) {
            // 타이머 완료시 알림
            showNotification(timer);
            return {
              ...timer,
              remainingTime: '완료!',
              isCompleted: true
            };
          }

          // 남은 시간 계산
          const minutes = Math.floor(timeDiff / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          
          return {
            ...timer,
            remainingTime: `${minutes}:${seconds.toString().padStart(2, '0')}`
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [showNotification]);  // showNotification을 dependency에 추가

  // 토스트 표시 함수
  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    // 3초 후 토스트 숨기기
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // 정렬 함수
  const handleSort = (key: SortKey) => {
    setSortDirection(prev => key === sortKey ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortKey(key);
  };

  // 정렬된 타이머 리스트
  const sortedTimerList = [...timerList].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'channel':
        return (a.channelNumber - b.channelNumber) * direction;
      case 'killedTime': {
        // HH:mm 형식의 시간을 비교하기 위해 분 단위로 변환
        const [aHours, aMinutes] = a.killedTime.split(':').map(Number);
        const [bHours, bMinutes] = b.killedTime.split(':').map(Number);
        const aTotal = aHours * 60 + aMinutes;
        const bTotal = bHours * 60 + bMinutes;
        return (aTotal - bTotal) * direction;
      }
      case 'dragonType':
        return a.dragonType.localeCompare(b.dragonType) * direction;
      case 'respawnTime':
        return (a.respawnTime.getTime() - b.respawnTime.getTime()) * direction;
      default:
        return 0;
    }
  });

  const handleAddTimer = () => {
    if (!channelNumber || !killedTime) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const now = new Date();
    const [hours, minutes] = killedTime.split(':').map(Number);
    const killedDate = new Date(now);
    killedDate.setHours(hours, minutes, 0, 0);

    // 시간 처리 로직 수정
    if (killedDate.getTime() > now.getTime()) {
      // 입력된 시간이 현재보다 미래인 경우, 하루 전으로 설정
      killedDate.setDate(killedDate.getDate() - 1);
    } else if (now.getTime() - killedDate.getTime() > 12 * 60 * 60 * 1000) {
      // 입력된 시간이 12시간 이상 과거인 경우, 다음날로 설정
      killedDate.setDate(killedDate.getDate() + 1);
    }

    const respawnDate = new Date(killedDate);
    respawnDate.setMinutes(respawnDate.getMinutes() + (dragonType === '수룡' ? 35 : 40));

    const newTimer: TimerData = {
      id: Date.now(),
      channelNumber: parseInt(channelNumber),
      killedTime: killedTime,
      dragonType: dragonType,
      respawnTime: respawnDate,
      remainingTime: '',
      isCompleted: false
    };

    setTimerList(prev => [...prev, newTimer]);
    setChannelNumber('');
    setKilledTime('');
  };

  // 타이머 삭제 함수
  const handleDeleteTimer = (id: number) => {
    setTimerList(prev => prev.filter(timer => timer.id !== id));
  };

  // 시간 입력 필드에 대한 ref 추가
  const timeInputRef = React.useRef<HTMLInputElement>(null);
  
  // 채널 번호 입력 처리
  const handleChannelNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setChannelNumber(value);
    
    // 4자리 입력 완료시 자동으로 다음 필드로 이동
    if (value.length === 4 && timeInputRef.current) {
      timeInputRef.current.focus();
    }
  };

  // 시간 입력 처리
  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length === 4) {
      const hours = value.slice(0, 2);
      const minutes = value.slice(2, 4);
      if (parseInt(hours) < 24 && parseInt(minutes) < 60) {
        setKilledTime(`${hours}:${minutes}`);
      }
    } else {
      setKilledTime(value);
    }
  };

  // 키 입력 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && channelNumber && killedTime) {
      handleAddTimer();
    }
  };

  return (
    <div className="App">
      <h1>클바유틸</h1>
      <div className="input-container">
        <input
          type="number"
          placeholder="채널 번호"
          value={channelNumber}
          onChange={handleChannelNumberChange}
          maxLength={4}
        />
        <input
          ref={timeInputRef}
          type="text"
          placeholder="HHmm"
          value={killedTime}
          onChange={handleTimeInputChange}
          onKeyPress={handleKeyPress}
          maxLength={5}
        />
        <div className="dragon-type-buttons">
          <button
            type="button"
            className={dragonType === '수룡' ? 'active' : ''}
            onClick={() => setDragonType('수룡')}
          >
            수룡
          </button>
          <button
            type="button"
            className={dragonType === '화룡' ? 'active' : ''}
            onClick={() => setDragonType('화룡')}
          >
            화룡
          </button>
        </div>
        <button onClick={handleAddTimer}>타이머 추가</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>NO</th>
              <th onClick={() => handleSort('channel')} className="sortable">
                채널 {sortKey === 'channel' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('killedTime')} className="sortable">
                잡은 시간 {sortKey === 'killedTime' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('dragonType')} className="sortable">
                드래곤 타입 {sortKey === 'dragonType' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('respawnTime')} className="sortable">
                리젠 예정 {sortKey === 'respawnTime' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>남은 시간</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {sortedTimerList.map((timer, index) => (
              <tr key={timer.id} className={timer.isCompleted ? 'completed' : ''}>
                <td>{index + 1}</td>
                <td>{timer.channelNumber}</td>
                <td>{timer.killedTime}</td>
                <td className={timer.dragonType === '수룡' ? 'dragon-water' : 'dragon-fire'}>
                  {timer.dragonType}
                </td>
                <td>
                  {timer.respawnTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: false 
                  })}
                </td>
                <td>{timer.remainingTime}</td>
                <td>
                  <button onClick={() => handleDeleteTimer(timer.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}

export default App;
