import React, { useEffect, useState } from 'react';
import Fuse from 'fuse.js';
import './App.css';

const MatchDetailsModal = ({ match, onClose }) => {
  if (!match) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button onClick={onClose} className="close-button">Close</button>
        <h2 className="match-title">{match.teams.home.name} vs {match.teams.away.name}</h2>
        
        <div className="team-logos">
          <img src={match.teams.home.logo} alt={`${match.teams.home.name} logo`} className="team-logo" />
          <span className="vs-text">vs</span>
          <img src={match.teams.away.logo} alt={`${match.teams.away.name} logo`} className="team-logo" />
        </div>
        
        <p className="match-date"><strong>Date:</strong> {new Date(match.fixture.date).toLocaleString()}</p>
        <p className="match-league"><strong>League:</strong> {match.league.name}</p>
        <p className="match-venue"><strong>Venue:</strong> {match.fixture.venue.name || 'N/A'}, {match.fixture.venue.city || 'N/A'}</p>
        <p className="match-referee"><strong>Referee:</strong> {match.fixture.referee || 'N/A'}</p>

        {match.score.fulltime.home !== null && match.score.fulltime.away !== null ? (
          <p className="match-score"><strong>Score:</strong> {match.teams.home.name} {match.score.fulltime.home} - {match.score.fulltime.away} {match.teams.away.name}</p>
        ) : (
          <p className="match-status"><strong>Status:</strong> Upcoming match</p>
        )}
      </div>
    </div>
  );
};

const MatchesWithPagination = () => {
  const [matches, setMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 10;

  const fuseOptions = {
    keys: ['teams.home.name', 'teams.away.name', 'league.name'],
    threshold: 0.3,
  };

  useEffect(() => {
    const fetchLeagues = async () => {
      var myHeaders = new Headers();
      myHeaders.append("x-rapidapi-key", "250209639a61fb749f83e11d8544414f");
      myHeaders.append("x-rapidapi-host", "https://v1.basketball.api-sports.io");

      var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };

      try {
        const response = await fetch('https://v3.football.api-sports.io/leagues', requestOptions);
        const result = await response.json();
        setLeagues(result.response);

      } catch (error) {
        console.log('Error fetching leagues:', error);
      }
    };

    fetchLeagues();
  }, []);

  useEffect(() => {
    const fetchMatchesByDate = async () => {
      var myHeaders = new Headers();
      myHeaders.append("x-rapidapi-key", "250209639a61fb749f83e11d8544414f");
      myHeaders.append("x-rapidapi-host", "v3.football.api-sports.io");

      var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };

      try {
        const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${selectedDate}`, requestOptions);
        const result = await response.json();

        const filteredMatches = selectedLeague
          ? result.response.filter(match => match.league.id === parseInt(selectedLeague))
          : result.response;

        setMatches(filteredMatches);
        setFilteredMatches(filteredMatches);
      } catch (error) {
        console.log('Error fetching matches:', error);
      }
    };

    fetchMatchesByDate();
  }, [selectedDate, selectedLeague]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query) {
      const fuse = new Fuse([...matches, ...leagues], fuseOptions);
      const results = fuse.search(query).slice(0, 10);
      setSuggestions(results.map(result => result.item));
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = () => {
    const fuse = new Fuse(matches, fuseOptions);
    const results = fuse.search(searchQuery).map(result => result.item);
    setFilteredMatches(results);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = filteredMatches.slice(indexOfFirstMatch, indexOfLastMatch);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="matches-container">
      <h1 className="heading">Football Matches</h1>

      <div className="search-container">
        <label htmlFor="searchBar" className="search-label">Search by team or league: </label>
        <input
          type="text"
          id="searchBar"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter team or league name"
          className="search-input"
        />
        {suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => {
                  setSearchQuery(suggestion.teams
                    ? `${suggestion.teams.home.name} vs ${suggestion.teams.away.name}`
                    : suggestion.league.name);
                  setSuggestions([]);
                  handleSearch();
                }}
                className="suggestion-item"
              >
                {suggestion.teams
                  ? `${suggestion.teams.home.name} vs ${suggestion.teams.away.name}`
                  : suggestion.league.name}
              </li>
            ))}
          </ul>
        )}

      <button onClick={handleSearch} className="search-button">Search</button>
      </div>

      

      <div className="filter-container">
        <label htmlFor="leagueFilter" className="filter-label">Filter by League: </label>
        <select
          id="leagueFilter"
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="league-filter"
        >
          <option value="">All Leagues</option>
          {leagues.map((league) => (
            <option key={league.league.id} value={league.league.id}>
              {league.league.name}
            </option>
          ))}
        </select>
      </div>

      <div className="date-picker-container">
        <label htmlFor="datePicker" className="date-label">Select Date: </label>
        <input
          type="date"
          id="datePicker"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-picker"
        />
      </div>

      {currentMatches.length > 0 ? (
        <ul className="matches-list">
          {currentMatches.map((match) => (
            <li
              key={match.fixture.id}
              onClick={() => setSelectedMatch(match)}
              className="match-item"
            >
              <div className="match-info">
              <div className="match-team">
              <img src={match.teams.home.logo} alt={`${match.teams.home.name} logo`} className="team-logo-small" />
              <strong>{match.teams.home.name}</strong>
              </div> vs 
              <div className="match-team">
              <img src={match.teams.away.logo} alt={`${match.teams.away.name} logo`} className="team-logo-small" />
              <strong>{match.teams.away.name}</strong> 
              </div>
              </div>
              {new Date(match.fixture.date).toLocaleTimeString()} in {match.league.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-matches">No matches found for the selected date or league.</p>
      )}

      <div className="pagination">
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">Previous</button>
        <button onClick={() => paginate(currentPage + 1)} disabled={indexOfLastMatch >= filteredMatches.length} className="pagination-button">Next</button>

        <div className="pagination-pages">
          {Array.from({ length: Math.ceil(filteredMatches.length / matchesPerPage) }, (_, index) => (
            <button key={index} onClick={() => paginate(index + 1)} disabled={currentPage === index + 1} className="pagination-page-button">
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      

      {selectedMatch && (
        <MatchDetailsModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
};

export default MatchesWithPagination;
