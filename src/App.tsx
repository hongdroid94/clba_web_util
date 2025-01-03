import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { TimerData, DragonType } from './types/timer';
import Toast from './components/Toast';

// 알림음 파일 추가 필요
const ALERT_SOUND = new Audio('/alert.mp3'); 

function App() {
  const [channelNumber, setChannelNumber] = useState<string>('');
  const [killedTime, setKilledTime] = useState<string>('');
  const [dragonType, setDragonType] = useState<DragonType>('수룡');
  const [timerList, setTimerList] = useState<TimerData[]>([]);
  const [toast, setToast] = useState({ message: '', isVisible: false });

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

  const handleAddTimer = () => {
    // 입력값 검증
    if (!channelNumber || !killedTime) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const now = new Date();
    const [hours, minutes] = killedTime.split(':').map(Number);
    const killedDate = new Date(now);
    killedDate.setHours(hours, minutes, 0, 0);

    // 입력된 시간이 현재 시간보다 미래인 경우 하루 전으로 설정
    if (killedDate > now) {
      killedDate.setDate(killedDate.getDate() - 1);
    }

    const respawnDate = new Date(killedDate);
    respawnDate.setMinutes(respawnDate.getMinutes() + (dragonType === '수룡' ? 30 : 40));

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
    
    // 입력 필드 초기화
    setChannelNumber('');
    setKilledTime('');
  };

  // 타이머 삭제 함수
  const handleDeleteTimer = (id: number) => {
    setTimerList(prev => prev.filter(timer => timer.id !== id));
  };

  return (
    <div className="App">
      <h1>클바유틸</h1>
      <div className="input-container">
        <input
          type="number"
          placeholder="채널 번호"
          value={channelNumber}
          onChange={(e) => setChannelNumber(e.target.value)}
        />
        <input
          type="time"
          value={killedTime}
          onChange={(e) => setKilledTime(e.target.value)}
        />
        <select
          value={dragonType}
          onChange={(e) => setDragonType(e.target.value as DragonType)}
        >
          <option value="수룡">수룡</option>
          <option value="화룡">화룡</option>
        </select>
        <button onClick={handleAddTimer}>타이머 추가</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>NO</th>
            <th>채널</th>
            <th>잡은 시간</th>
            <th>드래곤 타입</th>
            <th>리젠 예정</th>
            <th>남은 시간</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {timerList.map((timer, index) => (
            <tr key={timer.id} className={timer.isCompleted ? 'completed' : ''}>
              <td>{index + 1}</td>
              <td>{timer.channelNumber}</td>
              <td>{timer.killedTime}</td>
              <td>{timer.dragonType}</td>
              <td>{timer.respawnTime.toLocaleTimeString()}</td>
              <td>{timer.remainingTime}</td>
              <td>
                <button onClick={() => handleDeleteTimer(timer.id)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
      />
    </div>
  );
}

export default App;
