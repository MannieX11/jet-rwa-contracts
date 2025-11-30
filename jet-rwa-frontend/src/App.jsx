import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import JetRWA_ABI from './JetRWA.json'; // 确保你复制了文件
import JetImage from './assets/JetImage.jpg';

// 部署后的合约地址 (本地测试时，运行 deploy.js 后控制台会打印出来，请替换这里!)
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

function App() {
  // 状态管理
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [jetInfo, setJetInfo] = useState({ tailNumber: '...', manufacturer: '...' });
  const [userShare, setUserShare] = useState(0);
  const [dividends, setDividends] = useState(0);
  const [logs, setLogs] = useState([]);
  const [buyAmount, setBuyAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 1. 连接钱包
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAccount(signer.address);

        // 初始化合约实例
        const rwaContract = new ethers.Contract(CONTRACT_ADDRESS, JetRWA_ABI.abi, signer);
        setContract(rwaContract);
        
        // 加载数据
        fetchData(rwaContract, signer.address);
      } catch (error) {
        console.error("Connection failed:", error);
      }
    } else {
      alert("请安装 MetaMask!");
    }
  };

  // 2. 读取链上数据
  const fetchData = async (contractInstance, userAddress) => {
    try {
      // 获取飞机基本信息
      const tail = await contractInstance.tailNumber();
      const manuf = await contractInstance.manufacturer();
      setJetInfo({ tailNumber: tail, manufacturer: manuf });

      // 获取用户持仓
      const balance = await contractInstance.balanceOf(userAddress);
      setUserShare(balance.toString());

      // 获取可领分红
      const dividend = await contractInstance.withdrawableDividendOf(userAddress);
      setDividends(ethers.formatEther(dividend)); // 转换为 ETH 显示

      // 获取最近一次检修记录 (示例：只取第一条，实际可遍历)
      const count = await contractInstance.getMaintenanceCount();
      if (count > 0) {
        const log = await contractInstance.maintenanceHistory(count - 1n); // 获取最新的一条
        setLogs([{
          description: log.description,
          cost: log.cost.toString(),
          date: new Date(Number(log.timestamp) * 1000).toLocaleDateString()
        }]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // 3. 购买份额
  const handleBuy = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      // 假设价格固定，实际应从合约读取 sharePrice
      // 这里为了演示，假设每股 0.1 ETH
      const pricePerShare = ethers.parseEther("0.1"); 
      const totalCost = pricePerShare * BigInt(buyAmount);

      const tx = await contract.buyShares(buyAmount, { value: totalCost });
      await tx.wait(); // 等待交易确认
      
      alert("购买成功!");
      fetchData(contract, account); // 刷新数据
    } catch (error) {
      console.error(error);
      alert("交易失败: " + (error.reason || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 领取分红
  const handleClaim = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      const tx = await contract.claimDividends();
      await tx.wait();
      alert("分红领取成功!");
      fetchData(contract, account);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-10 font-sans">
      {/* 顶部导航 */}
      <div className="navbar bg-base-100 shadow-xl rounded-box mb-8">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl text-primary">✈️ JetRWADAO</a>
        </div>
        <div className="flex-none">
          {!account ? (
            <button className="btn btn-primary" onClick={connectWallet}>连接钱包</button>
          ) : (
            <button className="btn btn-outline btn-accent">
              {account.slice(0, 6)}...{account.slice(-4)}
            </button>
          )}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 卡片 1: 飞机资产信息 */}
        <div className="card w-full bg-base-100 shadow-xl image-full">
        {/* 注意：这里 src 的值变成了花括号包裹的变量名 */}
        <figure>
          <img 
            src={JetImage} 
            alt="Private Jet" 
            className="object-cover w-full h-64" // 顺便加个样式让它铺满卡片更好看
          />
        </figure>

          <div className="card-body">
            <h2 className="card-title text-3xl text-white">{jetInfo.manufacturer}</h2>
            <p className="text-xl">尾号: <span className="badge badge-lg badge-warning">{jetInfo.tailNumber}</span></p>
            <div className="card-actions justify-end">
              <div className="stat-desc text-gray-300">资产状态: 运营中</div>
            </div>
          </div>
        </div>

        {/* 卡片 2: 用户资产面板 */}
        <div className="card w-full bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">我的资产</h2>
            
            <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-200 mt-4">
              <div className="stat">
                <div className="stat-title">持有份额</div>
                <div className="stat-value text-primary">{userShare} 股</div>
              </div>
              
              <div className="stat">
                <div className="stat-title">待领分红</div>
                <div className="stat-value text-secondary">{parseFloat(dividends).toFixed(4)} ETH</div>
                <div className="stat-actions">
                  <button 
                    className={`btn btn-sm btn-success ${isLoading ? 'loading' : ''}`}
                    onClick={handleClaim}
                    disabled={Number(dividends) <= 0}
                  >
                    领取收益
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 卡片 3: 投资操作 */}
        <div className="card w-full bg-base-100 shadow-xl border border-primary">
          <div className="card-body">
            <h2 className="card-title">投资认购</h2>
            <p>当前单价: 0.1 ETH / 股</p>
            <div className="join mt-4">
              <input 
                className="input input-bordered join-item w-full" 
                type="number" 
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                min="1"
              />
              <button 
                className={`btn btn-primary join-item ${isLoading ? 'loading' : ''}`}
                onClick={handleBuy}
              >
                立即购买
              </button>
            </div>
          </div>
        </div>

        {/* 卡片 4: 检修日志 (区块链存证) */}
        <div className="card w-full bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">🛠️ 链上检修记录</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>项目</th>
                    <th>费用</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? logs.map((log, index) => (
                    <tr key={index}>
                      <td>{log.date}</td>
                      <td>{log.description}</td>
                      <td>${log.cost}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="text-center">暂无最新记录</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;