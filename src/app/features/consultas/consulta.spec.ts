import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ConsultaService } from './consulta';

describe('ConsultaService', () => {
  let service: ConsultaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(ConsultaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
