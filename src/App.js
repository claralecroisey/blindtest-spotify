import './App.css';
import './App.css';

import React, { Component } from 'react';
import Sound from 'react-sound';

import Button from './Button';
import logo from './logo.svg';

/*global swal*/
function shuffleArray(array) {
  let counter = array.length;

  while (counter > 0) {
    let index = getRandomNumber(counter);
    counter--;
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}

/* Return a random number between 0 included and x excluded */
function getRandomNumber(x) {
  return Math.floor(Math.random() * x);
}

const ApiConnectionState = {
  NO_TOKEN_ENTERED: 'NO_TOKEN_ENTERED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  VALID_TOKEN: 'VALID_TOKEN'
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      tracksNumber: 0,
      tracks: null,
      currentTrack: null,
      answersTracks: [],
      recordScore: 0,
      currentScore: 0,
      apiConnectionState: ApiConnectionState.NO_TOKEN_ENTERED
    };

    this.checkAnswer = this.checkAnswer.bind(this);
    this.selectNextTrack = this.selectNextTrack.bind(this);
    this.switchTrack = this.switchTrack.bind(this);
    this.renderContent = this.renderContent.bind(this);
    this.fetchTracks = this.fetchTracks.bind(this);
  }

  fetchTracks(apiToken) {
    fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      method: 'GET',
      headers: {
      Authorization: 'Bearer ' + apiToken,
      },
    })
    .then(response => {
      if (response.status === 401) {
        console.log("your Spotify API token has expired, please get another one");
        throw new Error(response);
      }
      return response;
    })
    .then(response => response.json())
    .then((data) => {
      const tracksNumber = data.items.length;
      const currentTrack = data.items[getRandomNumber(tracksNumber)];
      this.setState({
        tracksNumber,
        tracks: data.items,
        currentTrack,
        answersTracks: this.generateAnswerTracks(data.items, currentTrack),
        apiConnectionState: ApiConnectionState.VALID_TOKEN
      });
    })
    .catch(() => {
      this.setState({
        apiConnectionState: ApiConnectionState.INVALID_TOKEN
      });
    })
  }

  generateAnswerTracks(tracks, currentTrack) {
    const secondTrack = tracks[getRandomNumber(tracks.length)];
    const thirdTrack = tracks[getRandomNumber(tracks.length)];

    const roundTracks = [currentTrack, secondTrack, thirdTrack];
    return shuffleArray(roundTracks);
  }

  checkAnswer(track) {
    if (track.track.id === this.state.currentTrack.track.id) {
      swal('Bravo !', 'Tu as trouvé la bonne chanson! ;)', 'success')
      .then(() => {
        this.selectNextTrack();
        const newScore = this.state.currentScore + 1;
        this.setState({
          currentScore: newScore,
        });
      });
    }
    else {
      swal('Oups !', "Ce n'est pas la bonne chanson!", 'error')
      .then(() => {
        this.setState({
          currentScore: 0,
          recordScore: this.state.currentScore > this.state.recordScore ? this.state.currentScore : this.state.recordScore
        });
      });
    }
  }

  selectNextTrack() {
    const newTrack = this.state.tracks[getRandomNumber(this.state.tracksNumber)];
    this.setState({
      currentTrack: newTrack,
      answersTracks: this.generateAnswerTracks(this.state.tracks, newTrack)
    });
  }

  switchTrack() {
    this.setState({
      currentScore: 0
    });
    this.selectNextTrack();
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
          <ApiTokenForm onFormSubmit={this.fetchTracks} />
        </header>
        { this.renderContent() }
      </div>
    );
  }

  renderContent() {
    switch (this.state.apiConnectionState) {
      case ApiConnectionState.NO_TOKEN_ENTERED:
        return <div className="App-info">Enter an Api token to start playing! 😊 (get one <a target="_blank" href="https://developer.spotify.com/console/get-current-user-saved-tracks/?market=&limit=&offset=">here</a>)</div>;
      case ApiConnectionState.INVALID_TOKEN:
        return <div className="App-info">Uh oh, seems like your token is invalid! 😕 Your token might have expired. Please generate one again!</div>;
      case ApiConnectionState.VALID_TOKEN:
        return (
          <>
            <div className="App-images">
              <AlbumCover track={this.state.currentTrack} />
              <Sound url={this.state.currentTrack.track.preview_url} playStatus={Sound.status.PLAYING}/>
            </div>
            <div className="Scores-container">
              <div><span className="Score-label">Score -</span> {this.state.currentScore}</div>
              <div><span className="Score-label">Record -</span> {this.state.recordScore}</div>
            </div>
            <div className="App-buttons">
              {
                this.state.answersTracks.map((track) => <Button variant="primary" onClick={() => this.checkAnswer(track)}>{track.track.name}</Button>)
              }
            </div>
            <div className="App-buttons">
              <Button variant="secondary" onClick={this.switchTrack}>Switch track!</Button>
            </div>
          </>
        );
      default:
        return;
    }
  }
}

class AlbumCover extends Component {
  render() {
    const albumUrl = this.props.track.track.album.images[0].url;
    return (
      <div>
        <img src={albumUrl} style={{ width: 300, height: 300 }} />
      </div>);
  }
}

class ApiTokenForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onFormSubmit(this.state.value);
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="Form-field">
          <span className="Form-label">Enter your API token</span>
          <input className="Form-input" type="text" onChange={this.handleChange} value={this.state.value} />
          <Button variant='primary' type="submit">Fetch tracks</Button>
        </div>
      </form>
    );
  }
}

export default App;
