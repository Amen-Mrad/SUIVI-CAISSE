import React from 'react';

export default function AddDepenseBureauPage() {

  return (
    <>
      <style jsx>{`
        .page-container { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding: 2rem 0; }
        .header { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .title { background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 2rem; font-weight: 800; }
        .card { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 720px; margin: 0 auto; }
        .action-btn { background: linear-gradient(135deg, #28a745, #20c997); color: white; border: 0; border-radius: 12px; padding: 12px 24px; font-weight: 700; }
      `}</style>

      <div className="page-container">
        <div className="container">
          <div className="header">
            <h1 className="title"><i className="fas fa-plus me-2"></i>Ajouter une dépense bureau</h1>
            <p className="text-muted mb-0">Saisissez une dépense de type bureau via le formulaire.</p>
          </div>

        </div>
      </div>

    </>
  );
}


