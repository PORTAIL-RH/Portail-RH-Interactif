import React from 'react';

function App() {
  const handleClick = () => {
    alert('Bienvenue dans votre première page React !');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Bienvenue sur ma première page React</h1>
      <p style={styles.paragraph}>
        Ceci est une application React simple pour démarrer.
      </p>
      <button style={styles.button} onClick={handleClick}>
        Cliquez ici
      </button>
    </div>
  );
}

const styles = {
  container: {
    textAlign: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    color: '#333',
    fontSize: '2em',
  },
  paragraph: {
    color: '#666',
    fontSize: '1.2em',
  },
  button: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '1em',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default App;
